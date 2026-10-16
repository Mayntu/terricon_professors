import { useCallback } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowDownRight, Check } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'
import { useDemoSession } from '@/features/identity/demo-context'
import { JanaFlowMap } from '@/features/leave/components/JanaFlowMap'
import { StatusBadge } from '@/features/leave/components/StatusBadge'
import { DecisionPanel } from '@/features/leave/components/DecisionPanel'
import { formatDate, formatTimestamp } from '@/features/leave/dates'
import { statusLabels, nextStep } from '@/features/leave/presentation'
import type { RequestOptions } from '@/services/contracts'

export default function RequestDetailPage({ manager = false }: { manager?: boolean }) {
  const { requestId = '' } = useParams()
  const [params] = useSearchParams()
  const { user } = useDemoSession()
  const services = useServices()
  const load = useCallback((options?: RequestOptions) => services.leaveRequests.getById(requestId, options), [services, requestId])
  const query = useServiceQuery(load)
  const request = query.data
  const canDecide = user?.role === 'Manager' && user.id === request?.managerId && user.id !== request?.employeeId
  return <div className="business-page"><Link className="back-link" to={manager ? '/manager/approvals' : '/requests'}><ArrowLeft size={16} aria-hidden="true" />{manager ? 'Очередь согласования' : 'Мои заявки'}</Link>
    <WorkspaceHeading index="L–01 / ОТПУСК" title={request?.number ?? 'Маршрут заявки'}>{request ? `${formatDate(request.startDate)} — ${formatDate(request.endDate)} · ${request.requestedDays} календ. дн.` : 'История и движение вашей заявки.'}</WorkspaceHeading>
    {!request ? <QueryState problem={query.problem} retry={query.refresh} /> : <>
      {params.get('created') === '1' && request.status === 'Submitted' && request.employeeId === user?.id && <section className="creation-confirmation" role="status"><span className="confirmation-mark"><Check size={24} aria-hidden="true" /></span><div><span className="eyebrow">ЗАЯВКА СОЗДАНА</span><h2>Ваши планы — в движении</h2><p><strong>{request.number}</strong> · {formatDate(request.startDate)} — {formatDate(request.endDate)}</p><p>Следующий ответственный: {request.managerName}</p></div><a className="text-link" href="#flow-map">Посмотреть маршрут <ArrowDownRight size={18} aria-hidden="true" /></a></section>}
      <div className="request-status-line"><StatusBadge status={request.status} /><span>{nextStep(request)}</span><span className="eyebrow">ВЕРСИЯ {request.version.toString().padStart(2, '0')}</span></div>
      <div id="flow-map" tabIndex={-1}><JanaFlowMap request={request} /></div>
      {canDecide && <DecisionPanel key={request.id} request={request} />}
      <div className="request-detail-grid"><section className="request-history"><div className="section-heading"><div><span className="eyebrow">03 / ХРОНОЛОГИЯ</span><h2>История действий</h2></div><span className="history-count">{request.history.length.toString().padStart(2, '0')}</span></div><ol>{request.history.map((event) => <li key={event.id} data-status={event.status}><span className="timeline-node" aria-hidden="true" /><div><time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time><h3>{event.status === 'Submitted' ? 'Заявка отправлена' : statusLabels[event.status]}</h3><span className="timeline-actor">{event.actorLabel}</span>{event.comment && <p>{event.comment}</p>}</div></li>)}</ol></section>
        <section className="request-details"><span className="eyebrow">04 / ДЕТАЛИ</span><h2>Всё о заявке</h2><dl className="request-facts"><div><dt>Тип</dt><dd>Отпуск</dd></div><div><dt>Сотрудник</dt><dd>{request.employeeName}</dd></div><div><dt>Период</dt><dd>{formatDate(request.startDate)} — {formatDate(request.endDate)}</dd></div><div><dt>Длительность</dt><dd>{request.requestedDays} календ. дн.</dd></div><div><dt>Согласующий</dt><dd>{request.managerName}</dd></div><div><dt>Создана</dt><dd>{formatTimestamp(request.createdAt)}</dd></div></dl>{request.comment && <div className="request-comment"><span className="eyebrow">КОММЕНТАРИЙ СОТРУДНИКА</span><p>{request.comment}</p></div>}<p className="demo-footnote">Все действия выполнены в демонстрационной системе. Даты и баланс не являются кадровым учётом.</p></section></div>
    </>}
  </div>
}
