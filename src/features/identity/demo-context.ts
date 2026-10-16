import { createContext, useContext } from 'react'
import type { Role, User } from './model'
import type { ServiceResult } from '@/services/contracts'

export interface DemoSessionContextValue {
  role: Role | null
  user: User | null
  enterDemo: (role: Role) => Promise<ServiceResult<User>>
  leaveDemo: () => Promise<void>
}

export const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

export function useDemoSession() {
  const context = useContext(DemoSessionContext)
  if (!context) throw new Error('DemoSessionProvider is required')
  return context
}
