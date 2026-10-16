import type { LeaveStatus } from '../model'
import { statusLabels } from '../presentation'

export function StatusBadge({ status }: { status: LeaveStatus }) {
  return <span className="request-status" data-status={status}><span aria-hidden="true" />{statusLabels[status]}</span>
}
