import { lazy } from 'react'
import type { ExtModule } from '../ext-core/registry'

/** «Команда», сотрудники и реестр заявок HR — вместо заглушек напарника (team, hr-employees, hr-requests, hr-request). */
export const peopleModule: ExtModule = {
  id: 'ext-people',
  screens: [
    { id: 'team', titleKey: 'pp.team.title', roles: ['Manager'], component: lazy(() => import('./TeamPage')) },
    { id: 'hr-employees', titleKey: 'pp.emp.title', roles: ['HRAdmin'], component: lazy(() => import('./HrEmployeesPage')) },
    { id: 'hr-requests', titleKey: 'pp.req.title', roles: ['HRAdmin'], component: lazy(() => import('./HrRequestsPage')) },
    { id: 'ext-employee', path: '/employees/:employeeId', titleKey: 'pp.profile.index', roles: ['Employee', 'Manager', 'HRAdmin'], component: lazy(() => import('./EmployeePage')) },
    { id: 'hr-request', titleKey: 'pp.req.title', roles: ['HRAdmin'], component: lazy(() => import('./HrRequestPage')) },
  ],
}
