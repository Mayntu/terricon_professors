import { test, expect } from '@playwright/test'
import { createMockServices } from '../src/mocks/services'
import { MockStore, mockStorageKey, type Persistence } from '../src/mocks/store'
import { createSeed } from '../src/mocks/seed'
import type { Role } from '../src/features/identity/model'
import type { ServiceResult } from '../src/services/contracts'
import { calendarDays, parseCalendarDate, todayDate } from '../src/features/leave/dates'

function unwrap<T>(result: ServiceResult<T>): T { if (!result.ok) throw new Error(result.problem.message); return result.data }
function expectProblem(result: ServiceResult<unknown>, kind: string) { expect(result.ok).toBe(false); if (!result.ok) expect(result.problem.kind).toBe(kind) }
function dateAfter(days: number) { return new Date(Date.parse(`${todayDate()}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10) }
function setup() {
  let role: Role | null = 'Employee'
  const data = new Map<string, string>()
  const persistence: Persistence = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) } }
  const store = new MockStore(persistence)
  const services = createMockServices({ readRole: () => role, writeRole: (next) => { role = next } }, store)
  const input = { startDate: dateAfter(10), endDate: dateAfter(14), comment: '', submissionKey: crypto.randomUUID() }
  return { services, store, data, persistence, input }
}

test('service validates dates, day count, overlap and idempotent submission', async () => {
  const { services, store, input } = setup()
  expect(calendarDays('2028-02-28', '2028-03-01')).toBe(3)
  expect(calendarDays('2027-02-28', '2027-03-01')).toBe(2)
  expect(calendarDays(input.startDate, input.startDate)).toBe(1)
  expect(parseCalendarDate('2027-02-29')).toBeNull()
  for (const dates of [
    { startDate: '', endDate: '' },
    { startDate: '2099-02-30', endDate: '2099-03-02' },
    { startDate: dateAfter(20), endDate: dateAfter(19) },
    { startDate: dateAfter(-1), endDate: dateAfter(1) },
    { startDate: dateAfter(1), endDate: dateAfter(25) },
  ]) expectProblem(await services.leaveRequests.submit({ ...input, ...dates }), 'validation')
  const original = unwrap(await services.leaveRequests.submit(input))
  const repeated = unwrap(await services.leaveRequests.submit(input))
  expect(repeated.id).toBe(original.id)
  expect(store.read().requests).toHaveLength(1)
  expect(store.read().requests[0]?.history).toHaveLength(1)
  expectProblem(await services.leaveRequests.submit({ ...input, submissionKey: crypto.randomUUID() }), 'validation')
  expect(store.read().sequence).toBe(1)
})

test('team, ownership and role checks apply inside services', async () => {
  const { services, store, persistence, input } = setup()
  const request = unwrap(await services.leaveRequests.submit(input))
  expectProblem(await services.leaveRequests.decide(request.id, { decision: 'Approved', expectedVersion: 1 }), 'forbidden')
  await services.auth.signInDemo('HRAdmin')
  expectProblem(await services.leaveRequests.getById(request.id), 'forbidden')
  expectProblem(await services.leaveRequests.listTeam(), 'forbidden')
  expectProblem(await services.leaveRequests.decide(request.id, { decision: 'Approved', expectedVersion: 1 }), 'forbidden')
  await services.auth.signInDemo('Manager')
  expect(unwrap(await services.leaveRequests.listPendingApprovals()).items).toHaveLength(1)
  const state = store.read()
  // Transfer the employee to another team: a request's stored manager alone is insufficient.
  state.profiles = state.profiles.map((profile) => profile.id === request.employeeId ? { ...profile, manager: { id: 'demo-other-manager', displayName: 'Руководитель другой команды' } } : profile)
  persistence.setItem(mockStorageKey, JSON.stringify(state))
  expect(unwrap(await services.leaveRequests.listTeam()).items).toHaveLength(0)
  expectProblem(await services.leaveRequests.getById(request.id), 'forbidden')
  expectProblem(await services.leaveRequests.decide(request.id, { decision: 'Approved', expectedVersion: 1 }), 'forbidden')
  expect(store.read().notifications).toHaveLength(0)
  await services.auth.signOut()
  expectProblem(await services.leaveRequests.listMine(), 'unauthenticated')
})

test('rejection validation, optimistic version and competing decisions cannot duplicate events', async () => {
  const { services, store, input } = setup()
  const request = unwrap(await services.leaveRequests.submit(input))
  await services.auth.signInDemo('Manager')
  expectProblem(await services.leaveRequests.decide(request.id, { decision: 'Rejected', comment: '   ', expectedVersion: 1 }), 'validation')
  expectProblem(await services.leaveRequests.decide(request.id, { decision: 'Approved', expectedVersion: 0 }), 'conflict')
  const results = await Promise.all([
    services.leaveRequests.decide(request.id, { decision: 'Rejected', comment: '  Передать задачи  ', expectedVersion: 1 }),
    services.leaveRequests.decide(request.id, { decision: 'Approved', expectedVersion: 1 }),
  ])
  expect(results.filter((result) => result.ok)).toHaveLength(1)
  expectProblem(results[1]!, 'conflict')
  const final = unwrap(await services.leaveRequests.getById(request.id))
  expect(final.status).toBe('Rejected')
  expect(final.history).toHaveLength(2)
  expect(final.history[1]?.comment).toBe('Передать задачи')
  expectProblem(await services.leaveRequests.decide(request.id, { decision: 'Approved', expectedVersion: 2 }), 'conflict')
  expect(store.read().notifications).toHaveLength(1)
  await services.auth.signInDemo('Employee')
  expect(unwrap(await services.profiles.getMyProfile()).leaveBalance.days).toBe(24)
  const notification = unwrap(await services.notifications.listMine()).items[0]!
  await services.auth.signInDemo('Manager')
  expectProblem(await services.notifications.markRead(notification.id), 'not-found')
  await services.auth.signInDemo('Employee')
  const read = unwrap(await services.notifications.markRead(notification.id))
  expect(read.readAt).not.toBeNull()
  expect(unwrap(await services.notifications.markRead(notification.id)).readAt).toBe(read.readAt)
})

test('approval rechecks changed balance and leaves rejected transactions untouched', async () => {
  const { services, store, input } = setup()
  const first = unwrap(await services.leaveRequests.submit({ ...input, endDate: dateAfter(29) }))
  const second = unwrap(await services.leaveRequests.submit({ ...input, startDate: dateAfter(40), endDate: dateAfter(49), submissionKey: crypto.randomUUID() }))
  await services.auth.signInDemo('Manager')
  unwrap(await services.leaveRequests.decide(first.id, { decision: 'Approved', expectedVersion: 1 }))
  expectProblem(await services.leaveRequests.decide(second.id, { decision: 'Approved', expectedVersion: 1 }), 'conflict')
  expect(store.read().notifications).toHaveLength(1)
  expect(store.read().requests.find((request) => request.id === second.id)?.history).toHaveLength(1)
  await services.auth.signInDemo('Employee')
  expect(unwrap(await services.profiles.getMyProfile()).leaveBalance.days).toBe(4)
})

test('storage failure/corruption reports an error without a false successful mutation', async () => {
  const { services, store, persistence, data, input } = setup()
  persistence.setItem = () => { throw new Error('QuotaExceededError') }
  expectProblem(await services.leaveRequests.submit(input), 'unavailable')
  expect(store.read().requests).toHaveLength(0)
  data.set(mockStorageKey, '{corrupt')
  expectProblem(await services.leaveRequests.listMine(), 'unavailable')
  expectProblem(await services.leaveRequests.submit(input), 'unavailable')
  expect(data.get(mockStorageKey)).toBe('{corrupt')
  data.set(mockStorageKey, JSON.stringify({ ...createSeed(), schemaVersion: 200 }))
  expectProblem(await services.auth.signInDemo('Employee'), 'unavailable')
})
