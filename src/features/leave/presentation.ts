import { translate as t } from '@/modules/ext-core/main-i18n'
import type { LeaveRequest, LeaveStatus } from './model'

export const statusLabels: Record<LeaveStatus, string> = { Submitted: 'На согласовании', Approved: 'Согласовано', Rejected: 'Отклонено', Cancelled: 'Отменено', Escalated: 'Передано HR' }

export function nextStep(request: LeaveRequest) {
  if (request.status === 'Submitted') return t('Решение: {name}', { name: request.managerName })
  if (request.status === 'Escalated') return t('Решение: {name}', { name: 'HR' })
  if (request.status === 'Rejected') return t('Ознакомиться с причиной')
  if (request.status === 'Approved') return t('Согласование завершено')
  return t('Заявка закрыта')
}
