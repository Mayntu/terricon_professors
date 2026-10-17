import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { shortDate } from '../ext-core/format'
import { Markdown } from '../ext-core/Markdown'
import { ExtState } from '../ext-core/ui'
import './i18n'

interface Article { id: string; title: string; body: string; updatedAt: string; country: string; sourceLabel: string }

/** Документ-источник ответа (только своей страны — проверяет бэкенд). */
export default function SourcePage() {
  const t = useT()
  const { articleId = '' } = useParams()
  const q = useApi<Article>(`/ai/sources/${encodeURIComponent(articleId)}`)
  useEffect(() => { if (q.data) document.title = `${q.data.title} · JanaМен` }, [q.data])
  return <div className="business-page"><Link className="back-link" to="/ai-jana"><ArrowLeft size={16} aria-hidden="true" />{t('ai.source.back')}</Link>
    <WorkspaceHeading index={t('ai.source.title').toUpperCase()} title={q.data?.title ?? t('ai.source.title')}>{q.data && `${q.data.sourceLabel} · ${shortDate(q.data.updatedAt, true)}`}</WorkspaceHeading>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh}>{q.data && <article className="ext-section" data-testid="source-body"><Markdown text={q.data.body} /></article>}</ExtState>
  </div>
}
