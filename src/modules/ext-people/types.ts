export interface Training { courseId: string; title: string; status: string; lessonsPercent: number; scorePercent: number | null; dueDate: string | null }
export interface Profile {
  id: string; displayName: string; company: string; position: string; department: string; manager: { id: string; displayName: string } | null
  hiredOn: string; leaveBalance: { days: number; pendingDays: number; availableDays: number } | null; role: string; country: string
  gradeCode: string | null; monthlyBase: number | null; assignedTraining: Training[]
}
export interface Req {
  id: string; number: string; type: string; typeTitle: string; status: string; employeeId: string | null; employeeName: string | null
  approverKind: string; approverName: string | null; payload: Record<string, unknown>; createdAt: string; decidedAt: string | null; decidedBySystem: boolean
  version: number; permissions: { canDecide: boolean; canCancel: boolean }
  decisionReasonCode: string | null; decisionComment: string | null
  history: { id: string; event: string; status: string; occurredAt: string; actorLabel: string; comment: string | null }[]
  documents: { id: string; kind: string; number: string }[]
  extensions: { guarantee?: { deadlineAt: string; overdue: boolean } }
}
export const done = (p: Profile) => p.assignedTraining.filter((c) => c.status === 'Completed').length
export const statusTone = (s: string) => (s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : s === 'Cancelled' ? 'neutral' : 'warning') as 'success' | 'danger' | 'neutral' | 'warning'
export const PAYLOAD_KEYS = ['startDate', 'endDate', 'days', 'amount', 'period', 'category', 'question', 'text', 'comment'] as const
