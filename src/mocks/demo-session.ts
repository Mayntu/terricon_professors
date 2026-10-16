import type { Role } from '@/features/identity/model'
import type { DemoSessionStore } from '@/services/demo-session'

const storageKey = 'jana.demo-role.v1'
let memoryRole: Role | null = null

export const browserDemoSessionStore: DemoSessionStore = {
  readRole() {
    try {
      const value = sessionStorage.getItem(storageKey)
      return value === 'Employee' || value === 'Manager' || value === 'HRAdmin' ? value : null
    } catch { return memoryRole }
  },
  writeRole(role: Role | null) {
    memoryRole = role
    // Storage may be disabled. The demo remains usable in memory until refresh.
    try {
      if (role) sessionStorage.setItem(storageKey, role)
      else sessionStorage.removeItem(storageKey)
    } catch { /* No credential or data persistence is required for the demo. */ }
  },
}
