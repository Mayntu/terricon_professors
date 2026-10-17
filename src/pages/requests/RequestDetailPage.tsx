import { useT } from '@/modules/ext-core/main-i18n'
import { RequestHistory } from '@/features/leave/components/RequestHistory'
import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { SubmissionConfirmation } from '@/features/leave/components/SubmissionConfirmation'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'
import { useDemoSession } from '@/features/identity/demo-context'
import { JanaFlowMap } from '@/features/leave/components/JanaFlowMap'
import { StatusBadge } from '@/features/leave/components/StatusBadge'
import { DecisionPanel } from '@/features/leave/components/DecisionPanel'
import { formatDate, formatTimestamp } from '@/features/leave/dates'
import { nextStep } from '@/features/leave/presentation'
import type { RequestOptions } from '@/services/contracts'
import { ExtSlot } from '@/modules'

export default function RequestDetailPage({ manager = false }: { manager?: boolean }) {
  const t = useT()
  const { requestId = '' } = useParams()
  const [params] = useSearchParams()
  const { user } = useDemoSession()
  const services = useServices()
  const load = useCallback((options?: RequestOptions) => services.leaveRequests.getById(requestId, options), [services, requestId])
  const query = useServiceQuery(load)
  const request = query.data
  const canDecide = request?.permissions?.canDecide ?? (user?.role === 'Manager' && user.id === request?.managerId && user.id !== request?.employeeId)
  return <div className="business-page"><Link className="back-link" to={user?.role === 'HRAdmin' ? '/hr/requests' : manager ? '/manager/approvals' : '/requests'}><ArrowLeft size={16} aria-hidden="true" />{user?.role === 'HRAdmin' ? t('Реестр заявок') : manager ? t('Очередь согласования') : t('Мои заявки')}</Link>
    <WorkspaceHeading index={t('L–01 / ОТПУСК')} title={request?.number ?? t('Маршрут заявки')}>{request ? `${formatDate(request.startDate)} — ${formatDate(request.endDate)} · ${request.requestedDays} ${t('календ. дн.')}` : t('История и движение вашей заявки.')}</WorkspaceHeading>
    {!request ? <QueryState problem={query.problem} retry={query.refresh} /> : <>
      {params.get('created') === '1' && request.status === 'Submitted' && request.employeeId === user?.id && <SubmissionConfirmation request={request} />}
      <div className="request-status-line"><StatusBadge status={request.status} /><ExtSlot name="request.card.badges" requestId={request.id} /><span>{nextStep(request)}</span><span className="eyebrow">{t('ВЕРСИЯ')} {request.version.toString().padStart(2, '0')}</span></div>
      <div id="flow-map" tabIndex={-1}><JanaFlowMap request={request} /></div>
      {(canDecide || (['Manager', 'HRAdmin'].includes(user?.role ?? '') && request.employeeId !== user?.id && ['Approved', 'Rejected'].includes(request.status))) && <DecisionPanel key={request.id} request={request} />}
      <div className="request-detail-grid"><RequestHistory request={request} />
        <section className="request-details"><span className="eyebrow">{t('04 / ДЕТАЛИ')}</span><h2>{t('Всё о заявке')}</h2><dl className="request-facts"><div><dt>{t('Тип')}</dt><dd>{t('Отпуск')}</dd></div><div><dt>{t('Сотрудник')}</dt><dd>{request.employeeName}</dd></div><div><dt>{t('Период')}</dt><dd>{formatDate(request.startDate)} — {formatDate(request.endDate)}</dd></div><div><dt>{t('Длительность')}</dt><dd>{request.requestedDays} {t('календ. дн.')}</dd></div><div><dt>{t('Согласующий')}</dt><dd>{request.managerName}</dd></div><div><dt>{t('Создана')}</dt><dd>{formatTimestamp(request.createdAt)}</dd></div></dl>{request.comment && <div className="request-comment"><span className="eyebrow">{t('КОММЕНТАРИЙ СОТРУДНИКА')}</span><p>{request.comment}</p></div>}<p className="demo-footnote">{t('Все действия выполнены в демонстрационной системе. Даты и баланс не являются кадровым учётом.')}</p></section></div>
    </>}
  </div>
}
