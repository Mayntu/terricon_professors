import type { User, EmployeeProfile } from '../features/identity/model'
import type { LeaveRequest } from '../features/leave/model'
import type { Notification } from '../features/notifications/model'

export interface MockState {
  schemaVersion: 1
  sequence: number
  users: User[]
  profiles: EmployeeProfile[]
  requests: LeaveRequest[]
  notifications: Notification[]
}

/** Every identity is explicitly fictional; no personal data is used. */
export function createSeed(): MockState {
  const users: User[] = [
    { id: 'demo-employee', role: 'Employee', displayName: 'Демо Сотрудник' },
    { id: 'demo-manager', role: 'Manager', displayName: 'Демо Руководитель' },
    { id: 'demo-hr', role: 'HRAdmin', displayName: 'Демо HR' },
    { id: 'demo-other-employee', role: 'Employee', displayName: 'Сотрудник другой команды' },
    { id: 'demo-other-manager', role: 'Manager', displayName: 'Руководитель другой команды' },
  ]
  return {
    schemaVersion: 1, sequence: 0, users, requests: [], notifications: [],
    profiles: users.map((user) => ({
      id: user.id, displayName: user.displayName, company: 'Jana · демо-компания',
      position: user.role === 'Manager' ? 'Руководитель команды' : user.role === 'HRAdmin' ? 'HR-специалист' : 'Специалист команды',
      department: user.id.includes('other') ? 'Команда развития' : 'Команда продукта',
      manager: user.id === 'demo-manager' || user.id.includes('other')
        ? { id: 'demo-other-manager', displayName: 'Руководитель другой команды' }
        : { id: 'demo-manager', displayName: 'Демо Руководитель' },
      hiredOn: '2025-01-15', leaveBalance: { days: 24, asOf: '2026-01-01' },
    })),
  }
}
