const dayMilliseconds = 86_400_000

export function parseCalendarDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date.getTime() : null
}

export function calendarDays(start: string, end: string): number | null {
  const from = parseCalendarDate(start)
  const to = parseCalendarDate(end)
  return from !== null && to !== null && to >= from ? Math.round((to - from) / dayMilliseconds) + 1 : null
}

export function todayDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Qyzylorda', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function formatDate(value: string) {
  const parsed = parseCalendarDate(value)
  return parsed === null ? 'Не выбрано' : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed)
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Qyzylorda' }).format(new Date(value))
}

export function validateLeavePeriod(start: string, end: string, availableDays: number, today = todayDate()) {
  const errors: Record<string, readonly string[]> = {}
  if (parseCalendarDate(start) === null) errors.startDate = ['Выберите корректную дату начала.']
  else if (start < today) errors.startDate = ['В демо дата начала не может быть в прошлом.']
  if (parseCalendarDate(end) === null) errors.endDate = ['Выберите корректную дату окончания.']
  else if (parseCalendarDate(start) !== null && end < start) errors.endDate = ['Дата окончания не может быть раньше начала.']
  const days = calendarDays(start, end)
  if (days !== null && days > availableDays) errors.endDate = [`Период превышает тестовый остаток: ${availableDays} дн.`]
  return errors
}
