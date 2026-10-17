import { lazy } from 'react'
import { CalendarClock } from 'lucide-react'
import type { ExtModule } from '../ext-core/registry'

const ALL = ['Employee', 'Manager', 'HRAdmin'] as const

export const shiftsModule: ExtModule = {
  id: 'ext-shifts',
  feature: 'shifts',
  screens: [{ id: 'ext-shifts', path: '/shifts', titleKey: 'sh.title', roles: ALL, component: lazy(() => import('./ShiftsPage')) }],
  nav: [{ path: '/shifts', labelKey: 'sh.nav', icon: CalendarClock, roles: ALL }],
}
