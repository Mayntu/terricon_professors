import type { MockState } from './seed'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const strings = (value: Record<string, unknown>, keys: string[]) => keys.every((key) => typeof value[key] === 'string')
const timestamp = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))
const statuses = ['Submitted', 'Approved', 'Rejected', 'Cancelled']

/** Reject corrupt/old payloads; never silently overwrite a user's existing demo. */
export function isMockState(value: unknown): value is MockState {
  if (!record(value) || value.schemaVersion !== 1 || !Number.isInteger(value.sequence) || Number(value.sequence) < 0) return false
  if (!Array.isArray(value.users) || !value.users.length || !value.users.every((u: unknown) => record(u) && strings(u, ['id', 'displayName', 'role']) && ['Employee', 'Manager', 'HRAdmin'].includes(String(u.role)))) return false
  if (!Array.isArray(value.profiles) || !value.profiles.every((p: unknown) => record(p) && strings(p, ['id', 'displayName', 'company', 'position', 'department', 'hiredOn']) && record(p.leaveBalance) && Number.isFinite(p.leaveBalance.days) && typeof p.leaveBalance.asOf === 'string' && (p.manager === null || (record(p.manager) && strings(p.manager, ['id', 'displayName']))))) return false
  if (!Array.isArray(value.requests) || !value.requests.every((r: unknown) => record(r) && strings(r, ['id', 'number', 'submissionKey', 'employeeId', 'employeeName', 'managerId', 'managerName', 'startDate', 'endDate', 'comment']) && r.type === 'Leave' && statuses.includes(String(r.status)) && timestamp(r.createdAt) && Number.isInteger(r.version) && Number(r.version) > 0 && Number.isInteger(r.requestedDays) && Number(r.requestedDays) > 0 && Array.isArray(r.history) && r.history.length > 0 && r.history.every((e: unknown) => record(e) && strings(e, ['id', 'actorId', 'actorLabel']) && statuses.includes(String(e.status)) && timestamp(e.occurredAt) && (e.comment === null || typeof e.comment === 'string')))) return false
  return Array.isArray(value.notifications) && value.notifications.every((n: unknown) => record(n) && strings(n, ['id', 'userId', 'title', 'message']) && timestamp(n.createdAt) && (n.readAt === null || timestamp(n.readAt)) && record(n.target) && ((n.target.kind === 'request' && typeof n.target.requestId === 'string') || (n.target.kind === 'course' && typeof n.target.courseId === 'string')))
}
