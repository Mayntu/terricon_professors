import { Check, ArrowUpRight, X } from 'lucide-react'
import type { LeaveRequest } from '../model'

export function JanaFlowMap({ request, compact = false }: { request: LeaveRequest; compact?: boolean }) {
  const pending = request.status === 'Submitted'
  const approved = request.status === 'Approved'
  const rejected = request.status === 'Rejected'
  const nodes = [
    { title: 'Отправлено', person: request.employeeName, state: 'done', caption: 'Заявка зарегистрирована' },
    { title: pending ? 'Согласование' : approved ? 'Согласовано' : rejected ? 'Отклонено' : 'Отменено', person: request.managerName, state: pending ? 'current' : approved ? 'done' : 'rejected', caption: pending ? 'Ожидает решения' : 'Решение записано в историю' },
    { title: pending ? 'Ваш результат' : 'Результат получен', person: request.employeeName, state: pending ? 'waiting' : 'done', caption: pending ? 'Уведомим после решения' : 'Уведомление создано' },
  ]
  return <section className={`jana-flow-map ${compact ? 'jana-flow-map--compact' : ''}`} data-surface="dark" data-status={request.status} aria-label="Jana Flow Map">
    <div className="flow-map-heading"><span className="eyebrow">JANA FLOW MAP <span>/ L–01</span></span><span className="flow-map-live"><span />{pending ? 'Маршрут активен' : 'Маршрут завершён'}</span></div>
    <ol className="flow-stations">{nodes.map((node, index) => <li key={index} data-state={node.state} aria-current={node.state === 'current' ? 'step' : undefined}>
      <span className="flow-station-mark" aria-hidden="true">{node.state === 'done' ? <Check size={17} /> : node.state === 'rejected' ? <X size={17} /> : node.state === 'current' ? <ArrowUpRight size={17} /> : '03'}</span>
      <div><span className="flow-station-index">0{index + 1} / {node.state === 'current' ? 'СЕЙЧАС' : node.state === 'waiting' ? 'ДАЛЕЕ' : 'ПРОЙДЕНО'}</span><h3>{node.title}</h3><p>{node.person}</p>{!compact && <small>{node.caption}</small>}</div>
    </li>)}</ol>
    {!compact && <p className="flow-map-note">{pending ? 'Следующее действие — решение руководителя. Статус обновится в этом маршруте.' : approved ? 'Отпуск согласован в демо-системе. Тестовый остаток обновлён.' : 'Заявка закрыта. Причина решения сохранена в истории ниже.'}</p>}
  </section>
}
