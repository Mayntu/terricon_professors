import { useEffect, useState, type FormEvent } from 'react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/http/client'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { dateTime } from '../ext-core/format'
import { ExtState, LangSwitch, Pill } from '../ext-core/ui'
import { CATEGORIES, type RequestOut } from './types'
import './i18n'

const tone = (s: string) => (s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning') as 'success' | 'danger' | 'warning'

/** Подача обращения и «Мои обращения» (CLAUDE.md §7.6). */
export default function GrievancesPage() {
  const t = useT()
  const mine = useApi<{ items: RequestOut[] }>('/requests/my?type=grievance')
  const [form, setForm] = useState({ category: 'safety', text: '', anonymous: true })
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { document.title = `${t('gr.title')} · JanaМен` }, [t])
  async function send(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const r = await api.post<RequestOut>('/ext/grievances', form)
    setBusy(false)
    if (r.ok) { setResult({ ok: true, text: t('gr.sent', { number: r.data.number, date: r.data.extensions.guarantee ? dateTime(r.data.extensions.guarantee.deadlineAt) : '—' }) }); setForm({ ...form, text: '' }) }
    else setResult({ ok: false, text: r.problem.message })
  }
  return <div className="business-page">
    <WorkspaceHeading index={t('gr.index')} title={t('gr.title')}>{t('gr.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><span /><LangSwitch /></div>
    <section className="ext-section"><span className="eyebrow">01</span><h2>{t('gr.new')}</h2>
      <form className="ext-form" onSubmit={send} data-testid="grievance-form">
        <label><span>{t('gr.category')}</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`gr.cat.${c}`)}</option>)}</select></label>
        <label><span>{t('gr.text')}</span><textarea value={form.text} minLength={10} maxLength={4000} required onChange={(e) => { setForm({ ...form, text: e.target.value }); setResult(null) }} aria-describedby="gr-hint" /></label>
        <p id="gr-hint" className="field-hint">{t('gr.textHint')}</p>
        <label className="ext-check"><input type="checkbox" checked={form.anonymous} onChange={(e) => setForm({ ...form, anonymous: e.target.checked })} />{t('gr.anonymous')}</label>
        <p className="field-hint">{t('gr.anonymousHint')}</p>
        {result && <p className={result.ok ? 'ext-muted' : 'field-error'} role={result.ok ? 'status' : 'alert'}>{result.text}</p>}
        <div className="ext-actions"><Button type="submit" disabled={busy || form.text.trim().length < 10} aria-busy={busy}>{t('gr.send')}</Button></div>
      </form></section>
    <section className="ext-section"><span className="eyebrow">02</span><h2>{t('gr.mine')}</h2>
      <ExtState loading={mine.loading} problem={mine.problem} retry={mine.refresh} empty={!!mine.data && !mine.data.items.length} emptyTitle={t('gr.noMine')}>
        <ul className="ext-list" data-testid="grievances-mine">{mine.data?.items.map((g) => <li key={g.id}><div>
          <strong>{g.number} · {t(`gr.cat.${String(g.payload.category)}`)}</strong>
          <p className="ext-muted">{String(g.payload.text)}</p>
          <div className="ext-row"><Pill tone={tone(g.status)}>{g.typeTitle}: {g.status === 'Submitted' || g.status === 'Escalated' ? t('gr.waiting') : g.status}</Pill>{g.payload.anonymous ? <Pill>{t('gr.anonymousMark')}</Pill> : null}<span className="ext-muted">{dateTime(g.createdAt)}</span></div>
          {g.decisionComment && <p style={{ marginTop: '.5rem' }}><span className="eyebrow">{t('gr.answer')}</span><br />{g.decisionComment}</p>}
        </div></li>)}</ul>
      </ExtState></section>
  </div>
}
