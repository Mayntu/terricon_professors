export type NotificationTarget =
  | { readonly kind: 'request'; readonly requestId: string }
  | { readonly kind: 'course'; readonly courseId: string }

export interface EmployeeNotification {
  readonly id: string
  readonly title: string
  readonly createdAt: string
  readonly readAt: string | null
  readonly target: NotificationTarget
}
