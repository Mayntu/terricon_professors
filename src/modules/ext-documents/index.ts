import { lazy } from 'react'
import type { ExtModule } from '../ext-core/registry'

/** Документы Documentolog в карточке заявки — обязательная часть, без флага. */
export const documentsModule: ExtModule = { id: 'ext-documents', slots: { 'request.card.badges': [lazy(() => import('./DocumentBadge'))] } }
