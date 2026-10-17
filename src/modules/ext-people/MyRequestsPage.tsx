import { useState } from 'react'
import { Link } from 'react-router'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { StatusBadge } from '@/features/leave/components/StatusBadge'
import { statusLabels } from '@/features/leave/presentation'
import type { LeaveStatus } from '@/features/leave/model'
import { formatDate, formatTimestamp } from '@/features/leave/dates'
import { ExtSlot } from '../ext-core/ExtSlot'
import { useApi } from '../ext-core/useApi'
import { ExtState } from '../ext-core/ui'
import type { Req } from './types'

export default function MyRequestsPage({ manager = false }: { manager?: boolean }) {
  const q = useApi<{ items: Req[] }>(manager ? '/requests/inbox?status=all' : '/requests/my')
  const [status, setStatus] = useState(manager ? 'Submitted' : 'all')
  const [type, setType] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const requests = q.data?.items ?? []
  const rows = requests.filter(r => (status === 'all' || status === r.status) && (type === 'all' || type === r.type) && `${r.number} ${r.employeeName ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((a, b) => sort === 'start' ? String(a.payload.startDate ?? a.createdAt).localeCompare(String(b.payload.startDate ?? b.createdAt)) : a.createdAt.localeCompare(b.createdAt) * (sort === 'oldest' ? 1 : -1))
  const types = [...new Map(requests.map(r => [r.type, r.typeTitle])).entries()]
  return <div className="business-page"><div className="page-heading-row"><WorkspaceHeading index="02 / РЕЕСТР" title={manager ? 'Согласование заявок' : 'Мои заявки'}>Статус, история и следующий шаг по каждому обращению.</WorkspaceHeading>{!manager && <Link className="button button--primary" to="/requests/new/leave">Оформить отпуск</Link>}</div>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh}>
      <div className="register-toolbar"><label className="register-search"><span className="sr-only">Поиск заявки</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Номер или сотрудник" /></label>
        <label className="register-control"><span>Тип</span><select value={type} onChange={e => setType(e.target.value)}><option value="all">Все типы</option>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="register-control"><span>Статус</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Все статусы</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="register-control"><span>Сортировка</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Сначала новые</option><option value="oldest">Сначала ранние</option><option value="start">По началу отпуска</option></select></label></div>
      <p className="register-count eyebrow" role="status">Найдено заявок: {rows.length}</p>
      {rows.length ? <div className="request-table-scroll" tabIndex={0} role="region" aria-label="Реестр заявок"><table className="request-table"><thead><tr><th>Заявка / тип</th><th>Сотрудник / период</th><th>Создана</th><th>Статус</th><th>Следующий шаг</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}>
        <td><Link className="request-number" to={`${manager ? '/manager/approvals' : '/requests'}/${r.id}`}>{r.number}</Link><small>{r.typeTitle}</small></td>
        <td>{manager && <strong>{r.employeeName}</strong>}{typeof r.payload.startDate === 'string' && typeof r.payload.endDate === 'string' ? <span>{formatDate(r.payload.startDate)} — {formatDate(r.payload.endDate)}</span> : <span>{r.typeTitle}</span>}</td>
        <td>{formatTimestamp(r.createdAt)}</td><td><StatusBadge status={r.status as LeaveStatus} /><ExtSlot name="request.list.badge" requestId={r.id} /></td><td>{['Submitted', 'Escalated'].includes(r.status) ? `Решение: ${r.approverName ?? 'HR'}` : 'Решение сохранено'}</td>
      </tr>)}</tbody></table></div> : <div className="register-empty"><h2>{requests.length ? 'Нет совпадений' : 'Пока нет заявок'}</h2><p>Здесь появятся ваши обращения и решения.</p></div>}
    </ExtState>
  </div>
}
