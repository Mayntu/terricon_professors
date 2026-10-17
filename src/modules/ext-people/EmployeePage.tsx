import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { money, shortDate } from '../ext-core/format'
import { ExtState, Pill } from '../ext-core/ui'
import type { Profile } from './types'
import './i18n'

/** Профиль сотрудника для руководителя (только своя команда) и HR. Чужая команда → 403 с бэкенда → понятный экран. */
export default function EmployeePage() {
  const t = useT()
  const { employeeId = '' } = useParams()
  const q = useApi<Profile>(`/employees/${encodeURIComponent(employeeId)}`)
  useEffect(() => { if (q.data) document.title = `${q.data.displayName} · JanaМен` }, [q.data])
  const forbidden = q.problem?.kind === 'forbidden'
  const p = q.data
  return <div className="business-page">
    <Link className="back-link" to=".." relative="path" onClick={(e) => { if (window.history.length > 1) { e.preventDefault(); window.history.back() } }}><ArrowLeft size={16} aria-hidden="true" />{t('pp.profile.back')}</Link>
    <WorkspaceHeading index={t('pp.profile.index')} title={forbidden ? t('pp.forbidden.title') : p?.displayName ?? t('pp.profile.index')}>{forbidden ? '' : p ? `${p.position} · ${p.department}` : ''}</WorkspaceHeading>
    {forbidden ? <div className="register-empty ext-empty" role="alert" data-testid="employee-forbidden"><span aria-hidden="true">⊘</span><h2>{t('pp.forbidden.title')}</h2><p>{t('pp.forbidden.text')}</p></div>
      : <ExtState loading={q.loading} problem={q.problem} retry={q.refresh}>{p && <>
        <dl className="request-facts ext-section" data-testid="employee-profile">
          <div><dt>{t('pp.f.company')}</dt><dd>{p.company}</dd></div>
          <div><dt>{t('pp.f.position')}</dt><dd>{p.position}</dd></div>
          <div><dt>{t('pp.f.unit')}</dt><dd>{p.department}</dd></div>
          <div><dt>{t('pp.f.manager')}</dt><dd>{p.manager?.displayName ?? '—'}</dd></div>
          <div><dt>{t('pp.f.hired')}</dt><dd>{shortDate(p.hiredOn, true)}</dd></div>
          <div><dt>{t('pp.f.leave')}</dt><dd>{p.leaveBalance ? t('pp.days', { n: p.leaveBalance.availableDays }) : '—'}</dd></div>
          {p.gradeCode && <div><dt>{t('pp.f.grade')}</dt><dd>{p.gradeCode}</dd></div>}
          {p.monthlyBase != null && <div><dt>{t('pp.f.salary')}</dt><dd>{money(p.monthlyBase)}</dd></div>}
          <div><dt>{t('pp.f.country')}</dt><dd>{t(`common.country.${p.country}`)}</dd></div>
        </dl>
        <p className="field-hint">{t('pp.readonly')}</p>
        <section className="ext-section"><h2>{t('pp.training')}</h2>
          {p.assignedTraining.length ? <ul className="ext-list">{p.assignedTraining.map((c) => <li key={c.courseId}><div><strong>{c.title}</strong><span className="ext-muted">{c.lessonsPercent}%{c.scorePercent != null ? ` · ${c.scorePercent}%` : ''}{c.dueDate ? ` · ${shortDate(c.dueDate)}` : ''}</span></div><Pill tone={c.status === 'Completed' ? 'success' : 'neutral'}>{c.status === 'Completed' ? '✓' : `${c.lessonsPercent}%`}</Pill></li>)}</ul> : <p className="ext-muted">{t('pp.noCourses')}</p>}
        </section></>}
      </ExtState>}
  </div>
}
