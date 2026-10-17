import type { ApplicationServices, Page, ServiceResult } from '../contracts'
import type { DemoSessionStore } from '../demo-session'
import type { EmployeeProfile, Role, User } from '@/features/identity/model'
import type { LeaveRequest } from '@/features/leave/model'
import type { EmployeeNotification } from '@/features/notifications/model'
import { api, revisionStore, tokenStore } from './client'

interface LoginOut { accessToken: string; user: User }

/** В историю заявки напарника — только смены статуса. Служебные отметки бэкенда
 * (срок ответа, приказ в Documentolog) показывают ext-бейджи, а не его таймлайн. */
const STATUS_EVENTS = new Set(['created', 'approved', 'rejected', 'escalated', 'cancelled'])
type ApiEvent = LeaveRequest['history'][number] & { readonly event?: string }
type ApiLeave = Omit<LeaveRequest, 'history'> & { readonly history: readonly ApiEvent[] }
const toLeave = (request: ApiLeave): LeaveRequest => ({ ...request, history: request.history.filter((item) => !item.event || STATUS_EVENTS.has(item.event)) })
const mapOne = (result: ServiceResult<ApiLeave>): ServiceResult<LeaveRequest> => (result.ok ? { ok: true, data: toLeave(result.data) } : result)
/** Уведомления ext-фич приходят со ссылкой (`link`) и без `target`. Компоненты напарника знают только
 * request/course, поэтому цель выводится из ссылки, иначе — список заявок (не падать на null). */
type ApiNotification = Omit<EmployeeNotification, 'target'> & { readonly target: EmployeeNotification['target'] | null; readonly link?: string | null }
const toNotification = (n: ApiNotification): EmployeeNotification => {
  if (n.target) return n as EmployeeNotification
  const course = n.link?.match(/^\/academy\/(?:courses\/)?([^/?#]+)/)
  const request = n.link?.match(/^\/requests\/([^/?#]+)/)
  return { ...n, target: course?.[1] ? { kind: 'course', courseId: course[1] } : { kind: 'request', requestId: request?.[1] ?? '' } }
}
const mapPage = (result: ServiceResult<Page<ApiLeave>>): ServiceResult<Page<LeaveRequest>> => (result.ok ? { ok: true, data: { ...result.data, items: result.data.items.map(toLeave) } } : result)

/** Реальные сервисы поверх API бэкенда (docs/API_CONTRACT.md). Те же контракты, что и у mock-адаптера. */
export function createHttpServices(session: DemoSessionStore): ApplicationServices {
  async function signIn(body: { role: Role } | { login: string }): Promise<ServiceResult<User>> {
    const result = await api.post<LoginOut>('/demo/login-as', body)
    if (!result.ok) return result
    tokenStore.write(result.data.accessToken)
    session.writeRole(result.data.user.role)
    revisionStore.bump()
    return { ok: true, data: result.data.user }
  }

  return {
    subscribe: revisionStore.subscribe,
    getRevision: revisionStore.getRevision,
    auth: {
      async getCurrentUser() {
        if (!tokenStore.read()) { session.writeRole(null); return { ok: true, data: null } }
        const result = await api.get<User>('/auth/me')
        if (!result.ok && result.problem.kind === 'unauthenticated') { session.writeRole(null); return { ok: true, data: null } }
        if (result.ok) session.writeRole(result.data.role)
        return result
      },
      signInDemo: (role) => signIn({ role }),
      async signOut() { tokenStore.write(null); session.writeRole(null); revisionStore.bump(); return { ok: true, data: null } },
    },
    profiles: {
      // Кейс: остаток отпуска — с учётом заявок на рассмотрении. Бэкенд отдаёт и остаток 1С (days),
      // и доступное (availableDays); экраны напарника показывают days — подставляем доступное.
      getMyProfile: async (options) => {
        const result = await api.get<EmployeeProfile & { leaveBalance: { availableDays?: number } }>('/profile/me', options)
        if (!result.ok || result.data.leaveBalance.availableDays == null) return result
        return { ok: true, data: { ...result.data, leaveBalance: { ...result.data.leaveBalance, days: result.data.leaveBalance.availableDays, asOf: new Date().toISOString().slice(0, 10) } } }
      },
    },
    leaveRequests: {
      listMine: async (options) => mapPage(await api.get<Page<ApiLeave>>('/leave/my', options)),
      listTeam: async (options) => mapPage(await api.get<Page<ApiLeave>>('/leave/team', options)),
      listPendingApprovals: async (options) => mapPage(await api.get<Page<ApiLeave>>('/leave/pending', options)),
      getById: async (id, options) => mapOne(await api.get<ApiLeave>(`/leave/${encodeURIComponent(id)}`, options)),
      submit: async (input, options) => mapOne(await api.post<ApiLeave>('/leave', input, options)),
      decide: async (id, input, options) => mapOne(await api.post<ApiLeave>(`/leave/${encodeURIComponent(id)}/decision`, input, options)),
    },
    notifications: {
      listMine: async (options) => {
        const result = await api.get<Page<ApiNotification>>('/notifications', options)
        return result.ok ? { ok: true, data: { ...result.data, items: result.data.items.map(toNotification) } } : result
      },
      markRead: async (id, options) => {
        const result = await api.post<ApiNotification>(`/notifications/${encodeURIComponent(id)}/read`, undefined, options)
        return result.ok ? { ok: true, data: toNotification(result.data) } : result
      },
    },
  }
}

/** Вход за конкретного персонажа seed (демо-панель). Роль в сессии вкладки обновляется. */
export async function signInPersona(session: DemoSessionStore, login: string) {
  const result = await api.post<LoginOut>('/demo/login-as', { login })
  if (result.ok) { tokenStore.write(result.data.accessToken); session.writeRole(result.data.user.role); revisionStore.bump() }
  return result
}
