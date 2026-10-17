import type { NotificationTarget } from './model'
export function notificationPath(target: NotificationTarget): string {
  if (target.kind === 'request') return `/requests/${encodeURIComponent(target.requestId)}`
  if (target.kind === 'course') return `/academy/${encodeURIComponent(target.courseId)}`
  return /^\/(?![/\\])/.test(target.href) ? target.href : '/notifications'
}
