import { lazy } from 'react'
import { Inbox, MessageSquareWarning } from 'lucide-react'
import type { ExtModule } from '../ext-core/registry'

const ALL = ['Employee', 'Manager', 'HRAdmin'] as const

export const grievanceModule: ExtModule = {
  id: 'ext-grievance',
  screens: [
    { id: 'ext-grievances', path: '/grievances', titleKey: 'gr.title', roles: ALL, component: lazy(() => import('./GrievancesPage')), feature: 'grievance' },
    { id: 'ext-hr-inbox', path: '/hr/inbox', titleKey: 'gr.hr.title', roles: ['HRAdmin'], component: lazy(() => import('./HrInboxPage')) },
  ],
  nav: [
    { path: '/grievances', labelKey: 'gr.nav', icon: MessageSquareWarning, roles: ALL, feature: 'grievance' },
    { path: '/hr/inbox', labelKey: 'gr.hr.title', icon: Inbox, roles: ['HRAdmin'] },
  ],
}
