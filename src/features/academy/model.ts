export interface CourseSummary {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly durationMinutes: number
}

export interface CourseProgress {
  readonly courseId: string
  readonly completedLessonIds: readonly string[]
  readonly totalLessons: number
  readonly status: 'Assigned' | 'InProgress' | 'Completed'
  readonly scorePercent: number | null
}
