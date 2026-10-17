from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import not_found
from app.core.org.models import Country, Employee, Unit


async def get_employee(session: AsyncSession, employee_id: str) -> Employee:
    emp = await session.get(Employee, employee_id)
    if emp is None or not emp.active:
        raise not_found("Сотрудник не найден")
    return emp


async def find_by_login(session: AsyncSession, login: str) -> Employee | None:
    return (await session.scalars(select(Employee).where(Employee.login == login))).first()


async def list_team(session: AsyncSession, manager_id: str) -> list[Employee]:
    manager = await get_employee(session, manager_id)
    rows = await session.scalars(
        select(Employee).where(Employee.manager_id == manager_id, Employee.active, Employee.organization_id == manager.organization_id).order_by(Employee.full_name)
    )
    return list(rows)


async def list_hr(session: AsyncSession, country: str | None = None, organization_id: str | None = None) -> list[Employee]:
    q = select(Employee).where(Employee.role == "HRAdmin", Employee.active)
    if country:
        q = q.where(Employee.country == country)
    if organization_id:
        q = q.where(Employee.organization_id == organization_id)
    return list(await session.scalars(q))


async def get_unit(session: AsyncSession, unit_id: str) -> Unit | None:
    return await session.get(Unit, unit_id)


async def get_country(session: AsyncSession, code: str) -> Country | None:
    return await session.get(Country, code)
