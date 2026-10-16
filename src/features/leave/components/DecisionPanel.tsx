import { useRef, useState, type FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useServices } from '@/services/context'
import type { LeaveRequest } from '../model'

export function DecisionPanel({ request }: { request: LeaveRequest }) {
  const services = useServices()
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const reason = useRef<HTMLTextAreaElement>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current || request.status !== 'Submitted') return
    if (decision === 'Rejected' && !comment.trim()) { setError('Укажите причину отклонения.'); reason.current?.focus(); return }
    sending.current = true
    setBusy(true)
    setError(null)
    const result = await services.leaveRequests.decide(request.id, { decision, comment, expectedVersion: request.version })
    if (!result.ok) setError(result.problem.message)
    sending.current = false
    setBusy(false)
  }
  if (request.status !== 'Submitted') return <div className="decision-complete" role="status"><Check size={19} aria-hidden="true" /><p>Решение сохранено. Сотруднику создано уведомление.<small>Повторное решение по этой заявке недоступно.</small></p></div>
  return <section className="decision-panel"><div><span className="eyebrow">ВАШ ХОД / 02</span><h2>Решение по заявке</h2><p>Результат сразу появится у сотрудника.</p></div><form onSubmit={submit} noValidate><fieldset className="decision-options" disabled={busy}><legend className="sr-only">Решение руководителя</legend><label><input type="radio" name="decision" checked={decision === 'Approved'} onChange={() => { setDecision('Approved'); setError(null) }} /><span><Check size={18} aria-hidden="true" />Согласовать</span></label><label><input type="radio" name="decision" checked={decision === 'Rejected'} onChange={() => { setDecision('Rejected'); setError(null) }} /><span><X size={18} aria-hidden="true" />Отклонить</span></label></fieldset><label className="comment-field"><span>{decision === 'Rejected' ? 'Причина отклонения' : 'Комментарий к решению'} <small>{decision === 'Rejected' ? 'обязательно' : 'необязательно'}</small></span><textarea ref={reason} value={comment} required={decision === 'Rejected'} maxLength={1000} rows={3} disabled={busy} aria-invalid={!!error} aria-describedby={error ? 'decision-error' : undefined} onChange={(event) => { setComment(event.target.value); setError(null) }} /></label>{error && <p id="decision-error" className="field-error" role="alert">{error}</p>}<Button type="submit" disabled={busy} aria-busy={busy}>{busy ? 'Сохраняем…' : decision === 'Approved' ? 'Подтвердить согласование' : 'Подтвердить отклонение'}</Button></form></section>
}
