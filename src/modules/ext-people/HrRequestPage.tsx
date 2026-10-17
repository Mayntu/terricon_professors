import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { dateTime, money, shortDate } from '../ext-core/format'
import { ExtState, Pill } from '../ext-core/ui'
import { PAYLOAD_KEYS, statusTone, type Req } from './types'
import './i18n'

/** HR: карточка любой заявки с историей и документами (GET /api/requests/{id}). */
export default function HrRequestPage() {
  const t = useT()
  const { requestId = '' } = useParams()
  const q = useApi<Req>(`/requests/${encodeURIComponent(requestId)}`)
  const r = q.data
  const reasons = useApi<{ code: string; title: string }[]>(r?.decisionReasonCode ? `/ext/guarantees/reasons?type=${r.type}` : null)
  const evLabel = (e: string) => { const k = `pp.ev.${e}`; const v = t(k); return v === k ? t('pp.ev.note') : v }
  const reason = reasons.data?.find((x) => x.code === r?.decisionReasonCode)?.title ?? r?.decisionReasonCode
  useEffect(() => { if (r) document.title = `${r.number} · JanaМен` }, [r])
  return <div className="business-page"><Link className="back-link" to="/hr/requests"><ArrowLeft size={16} aria-hidden="true" />{t('pp.req.title')}</Link>
    <WorkspaceHeading index={r?.typeTitle.toUpperCase() ?? t('pp.req.index')} title={r?.number ?? t('pp.req.title')}>{r ? `${r.employeeName ?? t('pp.req.anonymous')} · ${dateTime(r.createdAt)}` : ''}</WorkspaceHeading>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh}>{r && <div data-testid="hr-request">
      <div className="ext-row"><Pill tone={statusTone(r.status)}>{t(`pp.st.${r.status}`)}</Pill>{r.decidedBySystem && <Pill tone="info">{t('pp.req.system')}</Pill>}<span className="ext-muted">{t('pp.req.approver')}: {r.approverName ?? r.approverKind}</span></div>
      <section className="ext-section"><h2>{t('pp.req.payload')}</h2><dl className="request-facts">{PAYLOAD_KEYS.filter((k) => r.payload[k] != null && r.payload[k] !== '').map((k) => { const v = r.payload[k]; return <div key={k}><dt>{t(`pp.pl.${k}`)}</dt><dd>{k === 'amount' && typeof v === 'number' ? money(v) : k.endsWith('Date') ? shortDate(String(v), true) : String(v)}</dd></div> })}</dl>
        {r.decisionComment && <p><span className="eyebrow">{t('pp.req.decision')}</span><br />{reason ? `${reason} · ` : ''}{r.decisionComment}</p>}</section>
      {r.documents.length > 0 && <section className="ext-section"><h2>{t('pp.req.documents')}</h2><ul className="ext-list">{r.documents.map((d) => <li key={d.id}><span>{d.number}</span><span className="ext-muted">{d.kind}</span></li>)}</ul></section>}
      <section className="ext-section"><h2>{t('pp.req.history')}</h2><ol className="ext-list" data-testid="hr-request-history">{r.history.map((h) => <li key={h.id}><div><strong>{h.actorLabel}</strong> <span className="ext-muted">· {evLabel(h.event)}</span>{h.comment && <p>{h.comment}</p>}</div><span className="ext-muted">{dateTime(h.occurredAt)}</span></li>)}</ol></section>
    </div>}</ExtState>
  </div>
}
