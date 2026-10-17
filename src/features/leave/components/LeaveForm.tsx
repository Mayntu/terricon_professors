import { useT } from '@/modules/ext-core/main-i18n'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { EmployeeProfile } from '@/features/identity/model'
import { useServices } from '@/services/context'
import { calendarDays, formatDate, validateLeavePeriod } from '../dates'

export function LeaveForm({ profile }: { profile: EmployeeProfile }) {
  const t = useT()
  const services = useServices()
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<Readonly<Record<string, readonly string[]>>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const submissionKey = useRef(crypto.randomUUID())
  const dialog = useRef<HTMLDialogElement>(null)
  const errorSummary = useRef<HTMLDivElement>(null)
  const days = calendarDays(startDate, endDate)
  const valid = !Object.keys(validateLeavePeriod(startDate, endDate, profile.leaveBalance.days)).length
  const phase = valid ? t('Можно отправлять') : startDate || endDate ? t('Выберите корректный период') : t('Начните с дат отпуска')

  function focusErrors() { requestAnimationFrame(() => errorSummary.current?.focus()) }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateLeavePeriod(startDate, endDate, profile.leaveBalance.days)
    setErrors(validation)
    setMessage(null)
    if (Object.keys(validation).length) { focusErrors(); return }
    dialog.current?.showModal()
  }
  async function submit() {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    const result = await services.leaveRequests.submit({ startDate, endDate, comment, submissionKey: submissionKey.current })
    if (result.ok) {
      dialog.current?.close()
      navigate(`/requests/${result.data.id}?created=1`, { replace: true })
    } else {
      dialog.current?.close()
      setMessage(result.problem.message)
      setErrors(result.problem.fieldErrors ?? {})
      focusErrors()
      sending.current = false
      setBusy(false)
    }
  }
  return <div className="leave-composition"><form className="leave-form" onSubmit={review} noValidate>
    <div className="form-section-label"><span className="eyebrow">{t('01 / ВЫБЕРИТЕ ПЕРИОД')}</span><CalendarDays size={20} strokeWidth={1.4} aria-hidden="true" /></div>
    <h2>{t('Время для себя')}</h2><p className="form-explanation">{t('Укажите первый и последний день отпуска. Руководитель получит заявку после вашего подтверждения.')}</p>
    <p className="form-balance-mobile">{t('Доступный остаток')} <strong>{profile.leaveBalance.days} {t('календ. дн.')}</strong></p>
    {(message || Object.keys(errors).length > 0) && <div className="form-error-summary" role="alert" tabIndex={-1} ref={errorSummary}><strong>{message ?? t('Проверьте даты перед отправкой.')}</strong>{Object.entries(errors).map(([field, messages]) => <a href={`#leave-${field}`} key={field}>{messages.join(' ')}</a>)}</div>}
    <div className="leave-date-fields">{[{ id: 'startDate', label: t('Первый день'), value: startDate, set: setStartDate }, { id: 'endDate', label: t('Последний день'), value: endDate, set: setEndDate }].map((field) => <div className="date-field" key={field.id}><label htmlFor={`leave-${field.id}`}>{field.label}</label><input id={`leave-${field.id}`} type="date" required value={field.value} aria-invalid={!!errors[field.id]} aria-describedby={errors[field.id] ? `${field.id}-error` : 'period-hint'} onChange={(event) => { field.set(event.target.value); setErrors({}); setMessage(null) }} />{errors[field.id] && <p id={`${field.id}-error`} className="field-error">{errors[field.id]?.join(' ')}</p>}</div>)}</div>
    <p id="period-hint" className="field-hint">{t('Обе даты входят в период. Можно выбрать сегодня или будущие даты.')}</p>
    <div className="duration-line" aria-live="polite"><span>{t('Продолжительность')}</span><strong>{valid ? `${days} ${t('календ. дн.')}` : '—'}</strong></div>
    <label className="comment-field" htmlFor="leave-comment"><span>{t('Комментарий руководителю')} <small>{t('необязательно')}</small></span><textarea id="leave-comment" rows={3} maxLength={1000} value={comment} placeholder={t('Например, кому передадите текущие задачи')} onChange={(event) => setComment(event.target.value)} /><small>{comment.length} / 1000</small></label>
    <div className="form-submit-row"><Button type="submit" disabled={busy}>{t('Проверить заявку')} <ArrowUpRight size={18} aria-hidden="true" /></Button><span className="form-phase" data-ready={valid} role="status">{valid && <Check size={15} aria-hidden="true" />}{phase}</span></div>
    <p className="demo-footnote">{t('Календарные дни и лимит — тестовые условия демонстрации. Они не отражают нормы закона и кадровую политику.')}</p>
  </form><aside className="leave-preview" aria-label={t('Предпросмотр заявки')}><div className="preview-balance"><span className="eyebrow">{t('ДОСТУПНО')}</span><p><strong>{profile.leaveBalance.days}</strong><span>{t('календ. дней')}</span></p><small>{t('При отправке дни резервируются до решения.')}</small></div><div className="preview-document"><div className="preview-topline"><span className="eyebrow">{t('ПРЕДПРОСМОТР / L–01')}</span><ArrowUpRight size={20} aria-hidden="true" /></div><h2>{t('Ваш отпуск')}</h2><p className="preview-dates">{startDate ? formatDate(startDate) : t('Первый день')}<br /><span>— {endDate ? formatDate(endDate) : t('последний день')}</span></p><dl><div><dt>{t('Сотрудник')}</dt><dd>{profile.displayName}</dd></div><div><dt>{t('После отправки')}</dt><dd>{valid && days !== null ? `${profile.leaveBalance.days - days} ${t('календ. дн.')}` : '—'}</dd></div></dl><span className="eyebrow">{t('БУДУЩИЙ МАРШРУТ')}</span><ol className="preview-stations"><li><span>01</span><div>{t('Вы')}<small>{t('Отправка заявки')}</small></div></li><li><span>02</span><div>{profile.manager?.displayName ?? 'HR'}<small>{t('Согласование')}</small></div></li><li><span>03</span><div>{t('Ваш результат')}<small>{t('Статус и уведомление')}</small></div></li></ol><p className="preview-note">{t('Номер появится после отправки')}</p></div></aside>
    <dialog className="confirmation-dialog" ref={dialog} aria-labelledby="confirm-title" onCancel={(event) => { if (busy) event.preventDefault() }}><div className="dialog-topline"><span className="eyebrow">{t('ПОСЛЕДНИЙ ШАГ / 02')}</span><button type="button" className="icon-button" disabled={busy} aria-label={t('Закрыть подтверждение')} onClick={() => dialog.current?.close()}><X size={20} /></button></div><h2 id="confirm-title">{t('Отправить заявку?')}</h2><p>{t('Проверьте период. Заявка будет передана руководителю.')}</p><div className="confirm-period"><span>{formatDate(startDate)}</span><ArrowRight size={20} aria-hidden="true" /><span>{formatDate(endDate)}</span></div><dl className="request-facts"><div><dt>{t('Продолжительность')}</dt><dd>{days} {t('календ. дн.')}</dd></div><div><dt>{t('Следующий ответственный')}</dt><dd>{profile.manager?.displayName ?? 'HR'}</dd></div></dl><div className="dialog-actions"><Button variant="secondary" disabled={busy} onClick={() => dialog.current?.close()}>{t('Вернуться к датам')}</Button><Button disabled={busy} aria-busy={busy} onClick={submit}>{busy ? t('Отправляем…') : t('Отправить заявку')}<ArrowUpRight size={18} aria-hidden="true" /></Button></div></dialog>
  </div>
}
