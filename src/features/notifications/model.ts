export type NotificationTarget =
  | { readonly kind: 'link'; readonly href: string }
  | { readonly kind: 'request'; readonly requestId: string }
  | { readonly kind: 'course'; readonly courseId: string }

export interface Notification {
  readonly id: string
  readonly userId: string
  readonly title: string
  readonly message: string
  readonly createdAt: string
  readonly readAt: string | null
  readonly target: NotificationTarget
}

export type EmployeeNotification = Notification
