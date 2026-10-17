import { lazy } from 'react'
import type { ExtModule } from '../ext-core/registry'

/** Пробелы базы знаний вместо заглушки напарника «База знаний HR» (/hr/knowledge). */
export const kbGapsModule: ExtModule = {
  id: 'ext-kb-gaps',
  feature: 'kb_gaps',
  screens: [{ id: 'hr-knowledge', titleKey: 'kb.title', roles: ['HRAdmin'], component: lazy(() => import('./KbGapsPage')) }],
}
