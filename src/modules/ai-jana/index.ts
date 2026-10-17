import { lazy } from 'react'
import type { ExtModule } from '../ext-core/registry'

const ALL = ['Employee', 'Manager', 'HRAdmin'] as const

/** AI Jana вместо заглушек напарника (assistant, source). */
export const aiJanaModule: ExtModule = {
  id: 'ai-jana',
  screens: [
    { id: 'assistant', titleKey: 'ai.title', roles: ALL, component: lazy(() => import('./AiJanaPage')) },
    { id: 'source', titleKey: 'ai.source.title', roles: ALL, component: lazy(() => import('./SourcePage')) },
  ],
}
