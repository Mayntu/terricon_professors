import { FileCheck2 } from 'lucide-react'
import { registerDictionary, useT } from '../ext-core/i18n'
import { useRequestExt } from '../ext-core/requestExt'
import { Pill } from '../ext-core/ui'

registerDictionary(
  { 'doc.leave_order': 'Приказ об отпуске № {number} смоделирован в Documentolog (mock)', 'doc.wage_advance': 'Заявление на аванс № {number} смоделировано в Documentolog (mock)', 'doc.other': 'Документ № {number} смоделирован в Documentolog (mock)' },
  { 'doc.leave_order': 'Демалыс туралы № {number} бұйрық Documentolog-та модельденді (mock)', 'doc.wage_advance': 'Аванс туралы № {number} өтініш Documentolog-та модельденді (mock)', 'doc.other': '№ {number} құжат Documentolog-та модельденді (mock)' },
)

/** Карточка заявки: документ, сформированный в mock Documentolog после одобрения (CLAUDE.md §5.2). */
export default function DocumentBadge({ requestId }: { requestId?: string }) {
  const t = useT()
  const ext = useRequestExt(requestId)
  if (!ext?.documents?.length) return null
  return <>{ext.documents.map((d) => {
    const key = `doc.${d.kind}`
    const text = t(key, { number: d.number })
    return <span key={d.id} data-testid="request-document"><Pill tone="success"><FileCheck2 size={14} aria-hidden="true" /> {text === key ? t('doc.other', { number: d.number }) : text}</Pill></span>
  })}</>
}
