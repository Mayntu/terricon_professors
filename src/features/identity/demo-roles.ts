import type { Role } from './model'

export const demoRoles = [
  { id: 'Employee', label: 'Сотрудник', shortLabel: 'Сотрудник', index: '01', description: 'Мой рабочий день', home: '/dashboard' },
  { id: 'Manager', label: 'Руководитель', shortLabel: 'Руководитель', index: '02', description: 'Моя команда', home: '/manager/approvals' },
  { id: 'HRAdmin', label: 'HR / Админ', shortLabel: 'HR / Админ', index: '03', description: 'Люди и процессы', home: '/hr' },
] as const satisfies readonly { id: Role; label: string; shortLabel: string; index: string; description: string; home: string }[]

export function getDemoRole(role: Role) {
  return demoRoles.find((item) => item.id === role) ?? demoRoles[0]
}
