import { useEffect, useState } from 'react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/motion/SegmentedControl'
import { api } from '@/services/http/client'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { dateTime } from '../ext-core/format'
import { featureEnabled } from '../ext-core/settings'
import { ExtState, LangSwitch, Pill } from '../ext-core/ui'
import type { RequestOut } from './types'
import './i18n'

type Kind = 'grievance' | 'hr_question'

/** HR: обращения (анонимные — без автора) и вопросы к HR из AI Jana — ответ через решение заявки. */
export default function HrInboxPage() {
  const t = useT()
  const [kind, setKind] = useState<Kind>(featureEnabled('grievance') ? 'grievance' : 'hr_question')
  const [scope, setScope] = useState<'open' | 'all'>('open')
  const q = useApi<{ items: RequestOut[] }>(`/requests/inbox?status=${scope}&type=${kind}`)
  useEffect(() => { document.title = `${t('gr.hr.title')} · JanaМен` }, [t])
  const kinds = [...(featureEnabled('grievance') ? [{ value: 'grievance' as Kind, label: t('gr.hr.tab.grievance') }] : []), { value: 'hr_question' as Kind, label: t('gr.hr.tab.question') }]
  return <div className="business-page">
    <WorkspaceHeading index="HR / ОБРАЩЕНИЯ" title={t('gr.hr.title')}>{t('gr.hr.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><div className="ext-row">
      {kinds.length > 1 && <div className="ext-tabs"><SegmentedControl<Kind> label={t('gr.hr.title')} value={kind} onChange={setKind} options={kinds} /></div>}
      <div className="ext-tabs ext-tabs--small" style={{ maxWidth: '14rem' }}><SegmentedControl<'open' | 'all'> label="scope" value={scope} onChange={setScope} options={[{ value: 'open', label: t('gr.hr.open') }, { value: 'all', label: t('gr.hr.all') }]} /></div></div><LangSwitch /></div>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.items.length} emptyTitle={kind === 'grievance' ? t('gr.hr.empty') : t('gr.hr.emptyQ')}>
      <ul className="ext-list" data-testid="hr-inbox">{q.data?.items.map((r) => <InboxItem key={r.id} r={r} />)}</ul>
    </ExtState>
  </div>
}

function InboxItem({ r }: { r: RequestOut }) {
  const t = useT()
  const [reply, setReply] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const g = r.extensions.guarantee
  async function decide(decision: 'Approved' | 'Rejected') {
    setBusy(true)
    const res = await api.post(`/requests/${r.id}/decide`, { decision, comment: reply, expectedVersion: r.version, ...(decision === 'Rejected' ? { reasonCode: 'NOT_HR_TOPIC' } : {}) })
    setBusy(false)
    if (!res.ok) setProblem(res.problem.message)
  }
  const text = r.type === 'grievance' ? String(r.payload.text) : String(r.payload.question)
  return <li data-request={r.id}><div style={{ flex: '1 1 28rem' }}>
    <strong>{r.number}{r.type === 'grievance' ? ` · ${t(`gr.cat.${String(r.payload.category)}`)}` : ''}</strong>
    <p>{text}</p>
    {r.type === 'hr_question' && r.payload.aiContext ? <p className="ext-muted"><span className="eyebrow">{t('gr.hr.aiContext')}</span><br />{String(r.payload.aiContext)}</p> : null}
    <div className="ext-row"><span className="ext-muted">{t('gr.hr.author')}: <strong data-testid="author">{r.employeeName ?? t('gr.hr.anonymous')}</strong></span><span className="ext-muted">{dateTime(r.createdAt)}</span>
      {g && r.permissions.canDecide && <Pill tone={g.overdue ? 'danger' : 'neutral'}>{t('gr.hr.until', { date: dateTime(g.deadlineAt) })}</Pill>}</div>
    {r.decisionComment && <p style={{ marginTop: '.5rem' }}><span className="eyebrow">{t('gr.answer')}</span><br />{r.decisionComment}</p>}
    {r.permissions.canDecide && <div className="ext-form" style={{ marginTop: '.75rem' }}>
      <label><span>{t('gr.hr.reply')}</span><textarea value={reply} onChange={(e) => { setReply(e.target.value); setProblem(null) }} /></label>
      <p className="field-hint">{t('gr.hr.replyHint')}</p>
      {problem && <p className="field-error" role="alert">{problem}</p>}
      <div className="ext-actions"><Button onClick={() => void decide('Approved')} disabled={busy || reply.trim().length < 10}>{t('gr.hr.answer')}</Button><Button variant="quiet" onClick={() => void decide('Rejected')} disabled={busy || reply.trim().length < 10}>{t('gr.hr.close')}</Button></div>
    </div>}
  </div></li>
}
