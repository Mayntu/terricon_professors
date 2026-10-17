import { lazy } from 'react'
import type { ExtModule } from '../ext-core/registry'

export const demoModule: ExtModule = { id: 'ext-demo', slots: { 'shell.overlay': [lazy(() => import('./DemoPanel'))] } }
