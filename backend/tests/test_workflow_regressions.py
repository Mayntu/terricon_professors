import asyncio
import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest
from sqlalchemy import select

from app.core import clock, db
from app.core.config import get_settings
from app.core.org.models import Employee
from app.core.requests.models import Request
from app.modules.ext_guarantees.models import Policy


def leave_body(days=3):
    start = clock.today() + timedelta(days=100)
    return {"startDate": str(start), "endDate": str(start + timedelta(days=days - 1)), "submissionKey": str(uuid4())}


async def create_leave(client, headers, days=3):
    r = await client.post('/api/leave', headers=headers, json=leave_body(days))
    assert r.status_code == 201, r.text
    return r.json()


@pytest.mark.parametrize('decision', ['Approved', 'Rejected'])
async def test_escalated_leave_reserves_days_and_hr_decides(client, login, decision):
    employee, manager, hr = await login('aigerim'), await login('erlan'), await login('daniyar')
    before = (await client.get('/api/leave/balance', headers=employee)).json()['availableDays']
    created = await create_leave(client, employee)
    assert (await client.get('/api/leave/balance', headers=employee)).json()['availableDays'] == before - 3
    assert (await client.post('/api/demo/advance-time', json={'hours': 49})).status_code == 200
    rid = created['id']
    card = (await client.get(f'/api/leave/{rid}', headers=hr)).json()
    assert card['status'] == 'Escalated' and card['permissions']['canDecide']
    assert card['managerName'] == 'HR'
    assert (await client.get('/api/leave/balance', headers=employee)).json()['availableDays'] == before - 3
    # Original calendar interval, not the interval relative to the advanced clock.
    body = {'startDate': created['startDate'], 'endDate': created['endDate'], 'submissionKey': str(uuid4())}
    overlap = await client.post('/api/leave', headers=employee, json=body)
    assert overlap.status_code == 409 and overlap.json()['code'] == 'OVERLAP'
    assert (await client.post(f'/api/leave/{rid}/decision', headers=manager, json={'decision': 'Approved', 'expectedVersion': card['version']})).status_code == 403
    empty = await client.post(f'/api/leave/{rid}/decision', headers=hr, json={'decision': 'Rejected', 'expectedVersion': card['version'], 'comment': ''})
    assert empty.status_code == 422
    result = await client.post(f'/api/leave/{rid}/decision', headers=hr, json={'decision': decision, 'expectedVersion': card['version'], 'comment': 'Проверено HR: решение по заявке', 'reasonCode': 'OTHER'})
    assert result.status_code == 200, result.text
    final = (await client.get(f'/api/leave/{rid}', headers=employee)).json()
    assert final['status'] == decision and final['history'][-1]['event'] in (decision.lower(), 'document_registered')
    assert not final['permissions']['canDecide']
    assert final['managerName'] == 'Данияр Оспанов'
    assert rid in {r['id'] for r in (await client.get('/api/requests/inbox?status=all', headers=hr)).json()['items']}
    assert len([e for e in final['history'] if e['event'] == decision.lower()]) == 1
    assert (await client.post(f'/api/leave/{rid}/decision', headers=hr, json={'decision': 'Approved', 'expectedVersion': final['version']})).status_code == 409
    balance = (await client.get('/api/leave/balance', headers=employee)).json()
    assert balance['availableDays'] == before - (3 if decision == 'Approved' else 0)
    notifications = (await client.get('/api/notifications', headers=employee)).json()['items']
    notice = next(n for n in notifications if n['kind'] == 'request.decided' and n['target']['requestId'] == rid)
    assert (await client.post(f"/api/notifications/{notice['id']}/read", headers=employee)).json()['readAt']
    assert next(n for n in (await client.get('/api/notifications', headers=employee)).json()['items'] if n['id'] == notice['id'])['readAt']


async def test_legacy_timeout_policy_cannot_auto_approve(client, login):
    employee, hr = await login('aigerim'), await login('daniyar')
    created = await create_leave(client, employee)
    async with db.sessionmaker()() as session:
        p = (await session.scalars(select(Policy).where(Policy.country == 'KZ', Policy.request_type == 'vacation'))).one()
        pid = p.id
        p.on_timeout = 'auto_approve'
        await session.commit()
    assert (await client.put(f'/api/ext/policies/{pid}', headers=hr, json={'onTimeout': 'auto_approve'})).status_code == 422
    await client.post('/api/demo/advance-time', json={'hours': 49})
    card = (await client.get(f"/api/requests/{created['id']}", headers=hr)).json()
    assert card['status'] == 'Escalated' and not card['decidedBySystem'] and not card['documents']


async def test_hr_cannot_access_another_organization(client, login):
    foreign = await login('asel')
    async with db.sessionmaker()() as session:
        emp = await session.get(Employee, 'emp-asel')
        emp.organization_id = 'another-company'
        emp.manager_id = None
        await session.commit()
    created = await create_leave(client, foreign)
    hr = await login('daniyar')
    for path in ['/api/employees/emp-asel', f"/api/leave/{created['id']}", f"/api/requests/{created['id']}"]:
        assert (await client.get(path, headers=hr)).status_code == 403, path
    for path in ['/api/requests/all', '/api/requests/inbox', '/api/leave/team']:
        assert created['id'] not in {r['id'] for r in (await client.get(path, headers=hr)).json()['items']}
    assert 'emp-asel' not in {r['id'] for r in (await client.get('/api/employees', headers=hr)).json()['items']}
    assert (await client.post('/api/academy/assignments', headers=hr, json={'employeeId': 'emp-asel', 'courseId': 'course-safety'})).status_code == 403
    for path in ['/api/academy/progress', '/api/ext/hr/risks']:
        assert 'emp-asel' not in {r['employeeId'] for r in (await client.get(path, headers=hr)).json()['items']}
    assert (await client.post(f"/api/requests/{created['id']}/decide", headers=hr, json={'decision': 'Approved'})).status_code == 403
    assert all(n.get('target', {}).get('requestId') != created['id'] for n in (await client.get('/api/notifications', headers=hr)).json()['items'] if n.get('target'))


async def test_expiration_claims_roles_and_logout(client, login):
    employee = await login('aigerim')
    settings = get_settings()
    for claims in [
        {'sub': 'emp-aigerim', 'exp': datetime.now(UTC) - timedelta(seconds=1)},
        {'sub': 'emp-aigerim'},
        {'exp': datetime.now(UTC) + timedelta(hours=1)},
    ]:
        token = jwt.encode(claims, settings.jwt_secret, algorithm='HS256')
        assert (await client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})).status_code == 401
    # Role is always loaded from the database, not trusted from a token claim.
    token = jwt.encode({'sub': 'emp-aigerim', 'role': 'HRAdmin', 'exp': datetime.now(UTC) + timedelta(hours=1)}, settings.jwt_secret, algorithm='HS256')
    assert (await client.get('/api/employees', headers={'Authorization': f'Bearer {token}'})).status_code == 403
    assert (await client.post('/api/auth/logout', headers=employee)).status_code == 204
    assert (await client.get('/api/auth/me', headers=employee)).status_code == 401
    assert (await client.get('/api/auth/me', headers=await login('aigerim'))).status_code == 200


@pytest.mark.skipif(not os.environ.get('QA_DATABASE_URL'), reason='Requires isolated PostgreSQL database')
async def test_concurrent_decisions_are_atomic(client, login):
    employee, manager = await login('aigerim'), await login('erlan')
    created = await create_leave(client, employee)
    responses = await asyncio.gather(*[
        client.post(f"/api/leave/{created['id']}/decision", headers=manager, json={'decision': 'Approved', 'expectedVersion': created['version']}) for _ in range(2)
    ])
    assert sorted(r.status_code for r in responses) == [200, 409]
    card = (await client.get(f"/api/requests/{created['id']}", headers=employee)).json()
    assert len([h for h in card['history'] if h['event'] == 'approved']) == 1
    assert len(card['documents']) == 1


@pytest.mark.skipif(not os.environ.get('QA_DATABASE_URL'), reason='Requires isolated PostgreSQL database')
async def test_concurrent_overlapping_submissions(client, login):
    employee = await login('aigerim')
    responses = await asyncio.gather(*[client.post('/api/leave', headers=employee, json=leave_body()) for _ in range(2)])
    assert sorted(r.status_code for r in responses) == [201, 409]
