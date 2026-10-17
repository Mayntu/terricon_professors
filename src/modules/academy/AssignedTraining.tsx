import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { shortDate } from '../ext-core/format'
import { Pill } from '../ext-core/ui'
import './i18n'

interface Training { courseId: string; title: string; status: 'Assigned' | 'InProgress' | 'Completed'; lessonsPercent: number; scorePercent: number | null; dueDate: string | null }

/** Назначенное обучение в профиле (поле кейса «Личный кабинет»): курс, прогресс, срок, результат. */
export default function AssignedTraining() {
  const t = useT()
  const q = useApi<{ assignedTraining: Training[] }>('/profile/me')
  const items = q.data?.assignedTraining
  if (!items) return null
  return <section className="ext-section" data-testid="assigned-training" aria-labelledby="assigned-training-title">
    <span className="eyebrow">{t('ac.index')}</span><h2 id="assigned-training-title">{t('ac.profile.title')}</h2>
    {items.length ? <ul className="ext-list">{items.map((c) => <li key={c.courseId}>
      <div><Link className="text-link" to={`/academy/${c.courseId}`}><strong>{c.title}</strong></Link><br />
        <span className="ext-muted">{c.status === 'Completed' && c.scorePercent != null ? t('ac.score', { n: c.scorePercent }) : `${c.lessonsPercent}%`}{c.dueDate && c.status !== 'Completed' ? ` · ${t('ac.due', { date: shortDate(c.dueDate) })}` : ''}</span></div>
      <Pill tone={c.status === 'Completed' ? 'success' : c.status === 'InProgress' ? 'info' : 'neutral'}>{t(`ac.status.${c.status}`)}</Pill>
    </li>)}</ul> : <p className="ext-muted">{t('ac.profile.none')}</p>}
    <div className="ext-actions"><Link className="text-link" to="/academy">{t('ac.title')} <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
  </section>
}
