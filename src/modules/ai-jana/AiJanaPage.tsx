import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Send } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/http/client'
import { useLang, useT } from '../ext-core/i18n'
import { useSettings } from '../ext-core/settings'
import { LangSwitch, Pill } from '../ext-core/ui'
import './i18n'

interface Source { articleId: string; title: string; section: string; sectionId: string; sourceLabel: string }
interface Answer { kind: 'grounded' | 'no-answer'; text: string | null; message: string | null; sources: Source[]; escalateAvailable: boolean; reason: string | null }
interface Turn { id: number; question: string; hrKey: string; answer?: Answer; error?: string; askedHr?: string; hrId?: string; hrBusy?: boolean; hrError?: string }

/** Чат AI Jana (PROJECT_SPEC.md §7.7): ответ с источниками, честный отказ, «Спросить HR» при escalate_available. */
export default function AiJanaPage() {
  const t = useT()
  const lang = useLang()
  const settings = useSettings()
  const [turns, setTurns] = useState<Turn[]>([])
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  const sending = useRef(false)
  const hrSending = useRef(new Set<number>())
  useEffect(() => { document.title = `${t('ai.title')} · JanaМен` }, [t])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [turns])

  async function ask(text: string) {
    const q = text.trim()
    if (!q || sending.current) return
    sending.current = true
    seq.current += 1
    const id = seq.current
    setTurns((all) => [...all, { id, question: q, hrKey: crypto.randomUUID() }])
    setQuestion('')
    setBusy(true)
    const r = await api.post<Answer>('/ai/ask', { question: q, lang })
    sending.current = false; setBusy(false)
    setTurns((all) => all.map((x) => (x.id === id ? (r.ok ? { ...x, answer: r.data } : { ...x, error: r.problem.message }) : x)))
  }
  async function askHr(turn: Turn) {
    if (turn.askedHr || hrSending.current.has(turn.id)) return
    hrSending.current.add(turn.id)
    setTurns(all => all.map(x => x.id === turn.id ? { ...x, hrBusy: true, hrError: '' } : x))
    const r = await api.post<{ id: string; number: string }>('/hr-questions', { question: turn.question, submissionKey: turn.hrKey, aiContext: turn.answer?.message ?? undefined })
    hrSending.current.delete(turn.id)
    setTurns(all => all.map(x => x.id === turn.id ? { ...x, hrBusy: false, ...(r.ok ? { askedHr: r.data.number, hrId: r.data.id } : { hrError: r.problem.message }) } : x))
  }
  function submit(e: FormEvent) { e.preventDefault(); void ask(question) }

  return <div className="business-page">
    <WorkspaceHeading index={t('ai.index')} title={t('ai.title')}>{t('ai.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><span className="eyebrow">{t('ai.country', { country: t(`common.country.${settings.country}`) })}</span><LangSwitch /></div>
    {!turns.length && <section className="ext-section"><span className="eyebrow">{t('ai.examples')}</span>
      <div className="ext-row" style={{ marginTop: '.75rem' }}>{['ai.ex1', 'ai.ex2', 'ai.ex3', 'ai.ex4'].map((k) => <Button key={k} variant="secondary" onClick={() => void ask(t(k))}>{t(k)}</Button>)}</div></section>}
    <div className="ext-chat ext-section" aria-live="polite" data-testid="ai-chat">
      {turns.map((turn) => <div key={turn.id} className="ext-chat">
        <div className="ext-bubble ext-bubble--me"><span className="eyebrow">{t('ai.you')}</span><p>{turn.question}</p></div>
        {turn.error ? <div className="service-error" role="alert"><p>{turn.error}</p><Button variant="secondary" disabled={busy} onClick={() => void ask(turn.question)}>{t('common.retry')}</Button></div>
          : turn.answer ? <div className="ext-bubble" data-kind={turn.answer.kind} data-testid="ai-answer"><span className="eyebrow">{t('ai.jana')}</span>
            {turn.answer.reason === 'other_person' && <p style={{ marginBottom: '.5rem' }}><Pill tone="info">{t('ai.refusedOther')}</Pill></p>}
            <p>{turn.answer.kind === 'grounded' ? turn.answer.text : turn.answer.message}</p>
            {turn.answer.sources.length > 0 && <div className="ext-sources"><span className="eyebrow">{t('ai.sources')}</span><p className="ext-muted">{t('ai.original')}</p>{turn.answer.sources.map((s) => <Link key={s.articleId + s.sectionId} className="text-link" to={`/knowledge/${encodeURIComponent(s.articleId)}#${s.sectionId}`}>{s.title} — {s.section} · <span className="ext-muted">{s.sourceLabel}</span> <ArrowUpRight size={14} aria-hidden="true" /></Link>)}</div>}
            {turn.answer.escalateAvailable && (turn.askedHr ? <div className="ext-actions"><p className="ext-muted" role="status">{t('ai.askedHr', { number: turn.askedHr })}</p><Link className="text-link" to={`/requests/${turn.hrId}`}>{t('ai.openHr')}</Link></div>
              : <div className="ext-actions"><Button variant="secondary" disabled={turn.hrBusy} aria-busy={!!turn.hrBusy} onClick={() => void askHr(turn)}>{turn.hrBusy ? t('common.sending') : t('ai.askHr')}</Button>{turn.hrError && <p className="field-error" role="alert">{turn.hrError}</p>}</div>)}
          </div>
          : <p className="query-loading" role="status">{t('ai.thinking')}</p>}
      </div>)}
      <div ref={end} />
    </div>
    <form className="ext-form ext-ask" onSubmit={submit}>
      <label><span className="sr-only">{t('ai.ask')}</span><textarea rows={2} maxLength={1000} value={question} placeholder={t('ai.placeholder')} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask(question) } }} /></label>
      <div className="ext-actions"><Button type="submit" disabled={busy || !question.trim()} aria-busy={busy}><Send size={17} aria-hidden="true" />{t('ai.ask')}</Button></div>
    </form>
  </div>
}
