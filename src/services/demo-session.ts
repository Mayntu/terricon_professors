import type { Role } from '@/features/identity/model'

/** Browser-only demo preference. This is never proof of identity or access. */
export interface DemoSessionStore {
  readRole(): Role | null
  writeRole(role: Role | null): void
}
