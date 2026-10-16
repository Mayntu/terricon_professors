export type Role = 'Employee' | 'Manager' | 'HRAdmin'

/** Future server-confirmed identity, never inferred from localStorage. */
export interface Session {
  readonly employeeId: string
  readonly role: Role
}

/** Official HR data is read-only in the employee interface. */
export interface EmployeeProfile {
  readonly id: string
  readonly displayName: string
  readonly company: string
  readonly position: string
  readonly department: string
  readonly manager: { readonly id: string; readonly displayName: string } | null
  /** ISO calendar date YYYY-MM-DD, without a timezone conversion. */
  readonly hiredOn: string
  readonly leaveBalance: { readonly days: number; readonly asOf: string }
}
