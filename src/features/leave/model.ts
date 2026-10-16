export type LeaveStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled'

export interface LeaveEvent {
  readonly id: string
  readonly status: LeaveStatus
  readonly occurredAt: string
  readonly actorLabel: string
  readonly comment: string | null
}

export interface LeaveRequest {
  readonly id: string
  readonly employeeId: string
  /** Calendar dates YYYY-MM-DD; authoritative day count comes from the service. */
  readonly startDate: string
  readonly endDate: string
  readonly requestedDays: number
  readonly comment: string
  readonly status: LeaveStatus
  readonly createdAt: string
  readonly version: number
  readonly history: readonly LeaveEvent[]
}

export interface SubmitLeaveInput {
  readonly startDate: string
  readonly endDate: string
  readonly comment: string
}

export type LeaveDecision =
  | { readonly decision: 'Approved'; readonly expectedVersion: number; readonly comment?: string }
  | { readonly decision: 'Rejected'; readonly expectedVersion: number; readonly comment: string }
