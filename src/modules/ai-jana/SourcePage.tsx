import { useEffect, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { shortDate } from '../ext-core/format'
import { Markdown } from '../ext-core/Markdown'
import { ExtState } from '../ext-core/ui'
import './i18n'

interface Article { id: string; title: string; body: string; updatedAt: string; country: string; sourceLabel: string; sections: { id: string; title: string; body: string }[] }

/** Документ-источник ответа (только своей страны — проверяет бэкенд). */
export default function SourcePage() {
  const t = useT()
  const { articleId = '' } = useParams()
  const { hash } = useLocation()
  const focusedSection = useRef('')
  const q = useApi<Article>(`/ai/sources/${encodeURIComponent(articleId)}`)
  useEffect(() => { if (q.data) document.title = `${q.data.title} · JanaМен` }, [q.data])
  useEffect(() => {
    if (!hash) { focusedSection.current = ''; return }
    if (!q.data || focusedSection.current === q.data.id + hash) return
    const section = document.getElementById(hash.slice(1))
    if (section) focusedSection.current = q.data.id + hash
    section?.focus({ preventScroll: true })
    section?.scrollIntoView({ block: 'start' })
  }, [q.data, hash])
  return <div className="business-page"><Link className="back-link" to="/ai-jana"><ArrowLeft size={16} aria-hidden="true" />{t('ai.source.back')}</Link>
    <WorkspaceHeading index={t('ai.source.title').toUpperCase()} title={q.data?.title ?? t('ai.source.title')}>{q.data && `${q.data.sourceLabel} · ${shortDate(q.data.updatedAt, true)}`}</WorkspaceHeading>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh}>{q.data && <article className="ext-section" data-testid="source-body"><p className="ext-muted">{t('ai.original')}</p>{q.data.sections?.length ? q.data.sections.map(s => <section id={s.id} key={s.id} tabIndex={-1} className="knowledge-section" aria-label={s.title}><h2>{s.title}</h2><Markdown text={s.body} /></section>) : <Markdown text={q.data.body} />}</article>}</ExtState>
  </div>
}
