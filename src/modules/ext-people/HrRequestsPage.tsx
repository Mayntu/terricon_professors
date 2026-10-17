import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { dateTime } from '../ext-core/format'
import { ExtState, LangSwitch, Pill } from '../ext-core/ui'
import { statusTone, type Req } from './types'
import './i18n'

const STATUSES = ['Submitted', 'Approved', 'Rejected', 'Escalated', 'Cancelled'] as const

/** HR: реестр всех заявок (GET /api/requests/all) с фильтрами. */
export default function HrRequestsPage() {
  const t = useT()
  const [f, setF] = useState({ type: '', status: '', country: '' })
  const types = useApi<{ code: string; title: string }[]>('/requests/types')
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString()
  const q = useApi<{ items: Req[] }>(`/requests/all${qs ? `?${qs}` : ''}`)
  useEffect(() => { document.title = `${t('pp.req.title')} · JanaМен` }, [t])
  return <div className="business-page">
    <WorkspaceHeading index={t('pp.req.index')} title={t('pp.req.title')}>{t('pp.req.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><div className="ext-form ext-filters" data-testid="registry-filters">
      <label><span>{t('pp.req.type')}</span><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="">{t('pp.req.any')}</option>{types.data?.map((x) => <option key={x.code} value={x.code}>{x.title}</option>)}</select></label>
      <label><span>{t('pp.req.status')}</span><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">{t('pp.req.any')}</option>{STATUSES.map((s) => <option key={s} value={s}>{t(`pp.st.${s}`)}</option>)}</select></label>
      <label><span>{t('pp.req.country')}</span><select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="">{t('pp.req.any')}</option><option value="KZ">KZ</option><option value="KG">KG</option></select></label>
    </div><LangSwitch /></div>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.items.length} emptyTitle={t('pp.req.empty')}>
      <ul className="ext-list" data-testid="registry">{q.data?.items.map((r) => <li key={r.id} data-request={r.id}>
        <div style={{ flex: '1 1 18rem' }}><Link className="text-link" to={`/hr/requests/${r.id}`}><strong>{r.number}</strong></Link> <span className="ext-muted">· {r.typeTitle}</span><br /><span data-testid="author">{r.employeeName ?? t('pp.req.anonymous')}</span></div>
        <div className="ext-row"><Pill tone={statusTone(r.status)}>{t(`pp.st.${r.status}`)}</Pill><span className="ext-muted">{dateTime(r.createdAt)}</span></div>
      </li>)}</ul>
    </ExtState>
  </div>
}
