import type { CourseProgress, CourseSummary } from '@/features/academy/model'
import type { AssistantAnswer, KnowledgeArticle } from '@/features/assistant/model'
import type { EmployeeProfile, Session, User, Role } from '@/features/identity/model'
import type { LeaveDecision, LeaveRequest, SubmitLeaveInput } from '@/features/leave/model'
import type { EmployeeNotification } from '@/features/notifications/model'

/** Proposed frontend ports, not a finalized ASP.NET API specification. */
export interface RequestOptions { readonly signal?: AbortSignal }

export interface Page<T> {
  readonly items: readonly T[]
  readonly nextCursor: string | null
}

export interface ListOptions extends RequestOptions {
  readonly cursor?: string
  readonly limit?: number
}

export interface ServiceProblem {
  readonly kind: 'unauthenticated' | 'forbidden' | 'not-found' | 'validation' | 'conflict' | 'unavailable'
  readonly message: string
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>
}

export type ServiceResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly problem: ServiceProblem }

export interface SessionService {
  getSession(options?: RequestOptions): Promise<ServiceResult<Session | null>>
}

export interface EmployeeService {
  getMyProfile(options?: RequestOptions): Promise<ServiceResult<EmployeeProfile>>
}

export interface LeaveService {
  listMine(options?: ListOptions): Promise<ServiceResult<Page<LeaveRequest>>>
  getById(id: string, options?: RequestOptions): Promise<ServiceResult<LeaveRequest>>
  submit(input: SubmitLeaveInput, options?: RequestOptions): Promise<ServiceResult<LeaveRequest>>
  listPendingApprovals(options?: ListOptions): Promise<ServiceResult<Page<LeaveRequest>>>
  decide(id: string, input: LeaveDecision, options?: RequestOptions): Promise<ServiceResult<LeaveRequest>>
}

export interface NotificationService {
  listMine(options?: ListOptions): Promise<ServiceResult<Page<EmployeeNotification>>>
  markRead(id: string, options?: RequestOptions): Promise<ServiceResult<EmployeeNotification>>
}

export interface IAuthService {
  getCurrentUser(): Promise<ServiceResult<User | null>>
  signIn(login: string, password: string): Promise<ServiceResult<User>>
  signInDemo(role: Role): Promise<ServiceResult<User>>
  signOut(): Promise<ServiceResult<null>>
}

export interface IProfileService extends EmployeeService {}
export interface ILeaveRequestService extends LeaveService {
  listTeam(options?: ListOptions): Promise<ServiceResult<Page<LeaveRequest>>>
}
export interface INotificationService extends NotificationService {}

/** Services are replaceable; invalidation is separate from their transport. */
export interface ApplicationServices {
  readonly auth: IAuthService
  readonly profiles: IProfileService
  readonly leaveRequests: ILeaveRequestService
  readonly notifications: INotificationService
  readonly subscribe: (listener: () => void) => () => void
  readonly getRevision: () => number
}

export interface AcademyService {
  listAssigned(options?: ListOptions): Promise<ServiceResult<Page<CourseSummary>>>
  getProgress(courseId: string, options?: RequestOptions): Promise<ServiceResult<CourseProgress>>
  completeLesson(courseId: string, lessonId: string, options?: RequestOptions): Promise<ServiceResult<CourseProgress>>
}

export interface AssistantService {
  ask(question: string, options?: RequestOptions): Promise<ServiceResult<AssistantAnswer>>
  getSource(articleId: string, options?: RequestOptions): Promise<ServiceResult<KnowledgeArticle>>
}
