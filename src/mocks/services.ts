import type { ApplicationServices, ServiceProblem, ServiceResult, Page } from '../services/contracts'
import type { DemoSessionStore } from '../services/demo-session'
import type { User, Role } from '../features/identity/model'
import type { LeaveRequest, LeaveDecision } from '../features/leave/model'
import { calendarDays, todayDate, validateLeavePeriod } from '../features/leave/dates'
import { MockStore } from './store'
import type { MockState } from './seed'

const roleIds: Record<Role, string> = { Employee: 'demo-employee', Manager: 'demo-manager', HRAdmin: 'demo-hr' }
const success = <T>(data: T): ServiceResult<T> => ({ ok: true, data })
const failure = (kind: ServiceProblem['kind'], message: string, fieldErrors?: ServiceProblem['fieldErrors']): { ok: false; problem: ServiceProblem } => ({ ok: false, problem: { kind, message, ...(fieldErrors ? { fieldErrors } : {}) } })
const pageOf = <T>(items: readonly T[]): Page<T> => ({ items, nextCursor: null })

function remainingDays(state: MockState, employeeId: string) {
  const initial = state.profiles.find((profile) => profile.id === employeeId)?.leaveBalance.days ?? 0
  return initial - state.requests.filter((request) => request.employeeId === employeeId && request.status === 'Approved').reduce((total, request) => total + request.requestedDays, 0)
}

function belongsToTeam(state: MockState, request: LeaveRequest, user: User) {
  return user.role === 'Manager' && user.id !== request.employeeId && request.managerId === user.id && state.profiles.find((profile) => profile.id === request.employeeId)?.manager?.id === user.id
}

export function createMockServices(session: DemoSessionStore, store = new MockStore()): ApplicationServices {
  function currentUser(state: MockState): User | null {
    const role = session.readRole()
    return role ? state.users.find((user) => user.id === roleIds[role] && user.role === role) ?? null : null
  }

  function withUser<T>(state: MockState, action: (user: User) => ServiceResult<T>): ServiceResult<T> {
    const user = currentUser(state)
    return user ? action(user) : failure('unauthenticated', 'Выберите демонстрационную роль, чтобы продолжить.')
  }

  async function read<T>(action: (state: MockState, user: User) => ServiceResult<T>): Promise<ServiceResult<T>> {
    try { const state = store.read(); return withUser(state, (user) => action(state, user)) }
    catch { return failure('unavailable', 'Не удалось прочитать демо-данные. Хранилище недоступно или имеет несовместимый формат; данные не сброшены.') }
  }

  function decide(state: MockState, user: User, id: string, input: LeaveDecision): ServiceResult<LeaveRequest> {
    const index = state.requests.findIndex((request) => request.id === id)
    const request = state.requests[index]
    if (!request) return failure('not-found', 'Заявка не найдена.')
    if (!belongsToTeam(state, request, user)) return failure('forbidden', 'В демо можно согласовать только заявку своей команды, кроме собственной.')
    if (request.status !== 'Submitted' || request.version !== input.expectedVersion) return failure('conflict', 'По заявке уже принято решение или данные изменились. Обновите страницу.')
    if (input.decision !== 'Approved' && input.decision !== 'Rejected') return failure('validation', 'Недопустимое решение.')
    const comment = input.comment?.trim() ?? ''
    if (input.decision === 'Rejected' && !comment) return failure('validation', 'Укажите причину отклонения.', { comment: ['Причина отклонения обязательна.'] })
    if (comment.length > 1000) return failure('validation', 'Комментарий не должен превышать 1000 символов.')
    if (input.decision === 'Approved' && request.requestedDays > remainingDays(state, request.employeeId)) return failure('conflict', 'Тестовый остаток изменился. Для этого периода недостаточно дней.')
    const now = new Date().toISOString()
    const updated: LeaveRequest = { ...request, status: input.decision, version: request.version + 1,
      history: [...request.history, { id: crypto.randomUUID(), status: input.decision, occurredAt: now, actorId: user.id, actorLabel: user.displayName, comment: comment || null }],
    }
    state.requests[index] = updated
    state.notifications.push({ id: crypto.randomUUID(), userId: request.employeeId,
      title: `${request.number} · ${input.decision === 'Approved' ? 'Отпуск согласован' : 'Заявка отклонена'}`,
      message: input.decision === 'Approved' ? `${user.displayName} согласовал заявку на отпуск.` : comment,
      createdAt: now, readAt: null, target: { kind: 'request', requestId: id },
    })
    return success(updated)
  }

  return {
    subscribe: store.subscribe, getRevision: store.getRevision,
    auth: {
      async getCurrentUser() {
        if (!session.readRole()) return success(null)
        try { return success(currentUser(store.read())) }
        catch { return failure('unavailable', 'Не удалось открыть сохранённое демо. Проверьте локальное хранилище.') }
      },
      async signInDemo(role) {
        try {
          const user = store.read().users.find((item) => item.id === roleIds[role] && item.role === role)
          if (!user) return failure('validation', 'Демо-роль не найдена.')
          session.writeRole(role)
          return success(user)
        } catch { return failure('unavailable', 'Не удалось открыть демо-данные. Хранилище не изменено.') }
      },
      async signOut() { session.writeRole(null); return success(null) },
    },
    profiles: {
      getMyProfile: () => read((state, user) => {
        const profile = state.profiles.find((item) => item.id === user.id)
        return profile ? success({ ...profile, leaveBalance: { days: remainingDays(state, user.id), asOf: todayDate() } }) : failure('not-found', 'Демо-профиль не найден.')
      }),
    },
    leaveRequests: {
      listMine: () => read((state, user) => success(pageOf(state.requests.filter((request) => request.employeeId === user.id)))),
      listTeam: () => read((state, user) => user.role === 'Manager' ? success(pageOf(state.requests.filter((request) => belongsToTeam(state, request, user)))) : failure('forbidden', 'Очередь доступна демо-руководителю.')),
      listPendingApprovals: () => read((state, user) => user.role === 'Manager' ? success(pageOf(state.requests.filter((request) => request.status === 'Submitted' && belongsToTeam(state, request, user)))) : failure('forbidden', 'Очередь доступна демо-руководителю.')),
      getById: (id) => read((state, user) => {
        const request = state.requests.find((item) => item.id === id)
        if (!request) return failure('not-found', 'Заявка не найдена.')
        return request.employeeId === user.id || belongsToTeam(state, request, user) ? success(request) : failure('forbidden', 'Эта заявка не относится к вам или вашей демо-команде.')
      }),
      submit: (input) => store.transact((state) => withUser(state, (user) => {
        if (!input.submissionKey?.trim()) return failure('validation', 'Не указан ключ отправки формы.')
        const previous = state.requests.find((request) => request.employeeId === user.id && request.submissionKey === input.submissionKey)
        if (previous) return success(previous)
        const profile = state.profiles.find((item) => item.id === user.id)
        if (!profile?.manager || profile.manager.id === user.id) return failure('validation', 'Для этого демо-профиля не назначен руководитель.')
        const errors = validateLeavePeriod(input.startDate, input.endDate, remainingDays(state, user.id))
        if (Object.keys(errors).length) return failure('validation', 'Проверьте период отпуска.', errors)
        if (input.comment.trim().length > 1000) return failure('validation', 'Комментарий не должен превышать 1000 символов.', { comment: ['Максимум 1000 символов.'] })
        const overlaps = state.requests.some((request) => request.employeeId === user.id && (request.status === 'Submitted' || request.status === 'Approved') && input.startDate <= request.endDate && input.endDate >= request.startDate)
        if (overlaps) return failure('validation', 'На этот период уже есть активная заявка.', { startDate: ['Даты пересекаются с вашей активной заявкой.'] })
        const days = calendarDays(input.startDate, input.endDate)
        if (days === null) return failure('validation', 'Некорректный период.')
        const now = new Date().toISOString()
        state.sequence += 1
        const request: LeaveRequest = { id: crypto.randomUUID(), number: `JL-${todayDate().slice(0, 4)}-${String(state.sequence).padStart(4, '0')}`, type: 'Leave', submissionKey: input.submissionKey,
          employeeId: user.id, employeeName: user.displayName, managerId: profile.manager.id, managerName: profile.manager.displayName,
          startDate: input.startDate, endDate: input.endDate, requestedDays: days, comment: input.comment.trim(), status: 'Submitted', createdAt: now, version: 1,
          history: [{ id: crypto.randomUUID(), status: 'Submitted', occurredAt: now, actorId: user.id, actorLabel: user.displayName, comment: 'Заявка отправлена на согласование.' }],
        }
        state.requests.push(request)
        return success(request)
      })),
      decide: (id, input) => store.transact((state) => withUser(state, (user) => decide(state, user, id, input))),
    },
    notifications: {
      listMine: () => read((state, user) => success(pageOf(state.notifications.filter((notification) => notification.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))))),
      markRead: (id) => store.transact((state) => withUser(state, (user) => {
        const index = state.notifications.findIndex((notification) => notification.id === id && notification.userId === user.id)
        const notification = state.notifications[index]
        if (!notification) return failure('not-found', 'Уведомление не найдено.')
        const updated = { ...notification, readAt: notification.readAt ?? new Date().toISOString() }
        state.notifications[index] = updated
        return success(updated)
      })),
    },
  }
}
