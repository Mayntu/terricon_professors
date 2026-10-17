import { getLang, registerDictionary, translate as t } from '@/modules/ext-core/i18n'

registerDictionary(
  { 'Не выбрано': 'Не выбрано', 'Выберите корректную дату начала.': 'Выберите корректную дату начала.', 'В демо дата начала не может быть в прошлом.': 'В демо дата начала не может быть в прошлом.', 'Выберите корректную дату окончания.': 'Выберите корректную дату окончания.', 'Дата окончания не может быть раньше начала.': 'Дата окончания не может быть раньше начала.', 'Период превышает тестовый остаток: {n} дн.': 'Период превышает тестовый остаток: {n} дн.' },
  { 'Не выбрано': 'Таңдалмады', 'Выберите корректную дату начала.': 'Дұрыс басталу күнін таңдаңыз.', 'В демо дата начала не может быть в прошлом.': 'Демо режимінде басталу күні өткен күн болмауы керек.', 'Выберите корректную дату окончания.': 'Дұрыс аяқталу күнін таңдаңыз.', 'Дата окончания не может быть раньше начала.': 'Аяқталу күні басталу күнінен бұрын болмауы керек.', 'Период превышает тестовый остаток: {n} дн.': 'Кезең тестілік қалдықтан асып тұр: {n} күн.' },
)
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
  return parsed === null ? t('Не выбрано') : new Intl.DateTimeFormat(getLang() === 'kk' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: getLang() === 'kk' ? '2-digit' : 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed)
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(getLang() === 'kk' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: getLang() === 'kk' ? '2-digit' : 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Qyzylorda' }).format(new Date(value))
}

export function validateLeavePeriod(start: string, end: string, availableDays: number, today = todayDate()) {
  const errors: Record<string, readonly string[]> = {}
  if (parseCalendarDate(start) === null) errors.startDate = [t('Выберите корректную дату начала.')]
  else if (start < today) errors.startDate = [t('В демо дата начала не может быть в прошлом.')]
  if (parseCalendarDate(end) === null) errors.endDate = [t('Выберите корректную дату окончания.')]
  else if (parseCalendarDate(start) !== null && end < start) errors.endDate = [t('Дата окончания не может быть раньше начала.')]
  const days = calendarDays(start, end)
  if (days !== null && days > availableDays) errors.endDate = [t('Период превышает тестовый остаток: {n} дн.', { n: availableDays })]
  return errors
}
