export interface RequestOut {
  id: string; number: string; type: string; typeTitle: string; status: string; employeeId: string | null; employeeName: string | null
  payload: Record<string, unknown>; createdAt: string; decidedAt: string | null; decisionComment: string | null; version: number
  permissions: { canDecide: boolean; canCancel: boolean }; extensions: { guarantee?: { deadlineAt: string; overdue: boolean } }
}
export const CATEGORIES = ['safety', 'pay', 'manager', 'conditions', 'discrimination', 'other'] as const
