import { useT } from '@/modules/ext-core/main-i18n'
import type { LeaveStatus } from '../model'
import { statusLabels } from '../presentation'
import { AnimatedValue } from '@/components/motion/AnimatedValue'

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const t = useT()
  return <span className="request-status" data-status={status}><span className="request-status-dot" aria-hidden="true" /><AnimatedValue value={t(statusLabels[status])} /></span>
}
