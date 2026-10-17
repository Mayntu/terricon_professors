import { Link } from 'react-router'
import { useT } from '../ext-core/i18n'
import { money } from '../ext-core/format'
import { done, type Profile } from './types'

/** Таблица людей: на телефоне — карточки (ext-table-scroll не нужен, строки переносятся). */
export function PeopleTable({ items, salary }: { items: Profile[]; salary: boolean }) {
  const t = useT()
  return <ul className="ext-list" data-testid="people">{items.map((p) => <li key={p.id} data-employee={p.id}>
    <div style={{ flex: '1 1 16rem' }}><Link className="text-link" to={`/employees/${p.id}`}><strong>{p.displayName}</strong></Link><br /><span className="ext-muted">{p.position} · {p.department}</span></div>
    <div style={{ flex: '0 1 10rem' }}><span className="eyebrow">{t('pp.col.leave')}</span><br />{p.leaveBalance ? t('pp.days', { n: p.leaveBalance.availableDays }) : '—'}{p.leaveBalance?.pendingDays ? <span className="ext-muted"> {t('pp.pending', { n: p.leaveBalance.pendingDays })}</span> : null}</div>
    <div style={{ flex: '0 1 10rem' }}><span className="eyebrow">{t('pp.col.training')}</span><br />{p.assignedTraining.length ? t('pp.courses', { done: done(p), total: p.assignedTraining.length }) : <span className="ext-muted">{t('pp.noCourses')}</span>}</div>
    {salary && <div style={{ flex: '0 1 9rem' }}><span className="eyebrow">{t('pp.col.salary')}</span><br />{p.monthlyBase != null ? money(p.monthlyBase) : '—'}</div>}
  </li>)}</ul>
}
