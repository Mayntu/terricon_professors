import { useEffect, useState } from 'react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { Button } from '@/components/ui/Button'
import { SegmentedControl } from '@/components/motion/SegmentedControl'
import { api } from '@/services/http/client'
import { useT } from '../ext-core/i18n'
import './i18n'
import { useApi } from '../ext-core/useApi'
import { dateTime } from '../ext-core/format'
import { Markdown } from '../ext-core/Markdown'
import { ExtState, LangSwitch, Pill } from '../ext-core/ui'


interface Gap { id: string; country: string; label: string; count: number; samples: string[]; status: 'open' | 'drafted' | 'published'; draftDocId: string | null; lastAskedAt: string }
interface Doc { id: string; title: string; sourceLabel: string; bodyMd: string; status: string }
type Country = 'KZ' | 'KG'

export default function KbGapsPage() {
  const t = useT()
  const [country, setCountry] = useState<Country>('KZ')
  const q = useApi<Gap[]>(`/ext/kb/gaps?country=${country}`)
  const [openId, setOpenId] = useState<string | null>(null)
  useEffect(() => { document.title = `${t('kb.title')} · JanaМен` }, [t])
  return <div className="business-page">
    <WorkspaceHeading index={t('kb.index')} title={t('kb.title')}>{t('kb.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><div className="ext-tabs ext-tabs--small"><SegmentedControl<Country> label="Country" value={country} onChange={(c) => { setCountry(c); setOpenId(null) }} options={[{ value: 'KZ', label: 'KZ' }, { value: 'KG', label: 'KG' }]} /></div><LangSwitch /></div>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.length} emptyTitle={t('kb.empty')} emptyText={t('kb.emptyText')}>
      <ul className="ext-list" data-testid="kb-gaps">{q.data?.map((g) => <li key={g.id} data-gap={g.id}><div style={{ flex: '1 1 30rem' }}>
        <p className="ext-figure ext-figure--ink" style={{ fontSize: '1.5rem' }}>{t('kb.count', { n: g.count })}: {g.label}</p>
        <div className="ext-row"><Pill tone={g.status === 'published' ? 'success' : g.status === 'drafted' ? 'info' : 'warning'}>{t(`kb.status.${g.status}`)}</Pill><span className="ext-muted">{t('kb.last', { date: dateTime(g.lastAskedAt) })}</span></div>
        <details style={{ marginTop: '.5rem' }}><summary className="text-link">{t('kb.samples')}</summary><ul>{g.samples.map((s) => <li key={s}>{s}</li>)}</ul></details>
        {openId === g.id && <Editor gap={g} />}
      </div>
        {g.status !== 'published' && openId !== g.id && <Button variant={g.draftDocId ? 'secondary' : 'primary'} onClick={() => setOpenId(g.id)}>{g.draftDocId ? t('kb.edit') : t('kb.draft')}</Button>}
      </li>)}</ul>
    </ExtState>
  </div>
}

function Editor({ gap }: { gap: Gap }) {
  const t = useT()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    void api.post<Doc>(`/ext/kb/gaps/${gap.id}/draft`).then((r) => { if (active && r.ok) setDoc(r.data) })
    return () => { active = false }
  }, [gap.id])
  if (!doc) return <p className="query-loading" role="status">{t('common.loading')}</p>
  async function save(): Promise<boolean> {
    if (!doc) return false
    const r = await api.put<Doc>(`/ext/kb/docs/${doc.id}`, { title: doc.title, sourceLabel: doc.sourceLabel, bodyMd: doc.bodyMd })
    setMsg(r.ok ? { ok: true, text: t('kb.saved') } : { ok: false, text: r.problem.message })
    return r.ok
  }
  async function publish() {
    if (!doc) return
    setBusy(true)
    if (await save()) {
      const r = await api.post<Doc>(`/ext/kb/docs/${doc.id}/publish`)
      setMsg(r.ok ? { ok: true, text: t('kb.published') } : { ok: false, text: r.problem.message })
    }
    setBusy(false)
  }
  return <div className="ext-kb-editor" data-testid="kb-editor">
    <div className="ext-form" style={{ maxWidth: 'none' }}>
      <label><span>{t('kb.docTitle')}</span><input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} /></label>
      <label><span>{t('kb.source')}</span><input value={doc.sourceLabel} onChange={(e) => setDoc({ ...doc, sourceLabel: e.target.value })} /></label>
      <label><span>{t('kb.body')}</span><textarea rows={8} value={doc.bodyMd} onChange={(e) => setDoc({ ...doc, bodyMd: e.target.value })} /></label>
    </div>
    <div className="ext-panel"><span className="eyebrow">{t('kb.preview')}</span><h3 style={{ marginTop: '.4rem' }}>{doc.title}</h3><Markdown text={doc.bodyMd} /><p className="ext-muted">{doc.sourceLabel}</p></div>
    {msg && <p className={msg.ok ? 'ext-muted' : 'field-error'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
    <div className="ext-actions"><Button variant="secondary" onClick={() => void save()} disabled={busy}>{t('kb.save')}</Button><Button onClick={() => void publish()} disabled={busy} aria-busy={busy}>{t('kb.publish')}</Button></div>
  </div>
}
