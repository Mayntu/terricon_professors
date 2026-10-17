import { useRef, useState, type FormEvent } from 'react'
import { api } from '@/services/http/client'
import { Button } from '@/components/ui/Button'
import { RejectReason } from '../ext-guarantees/RejectReason'
import { useRejectReasonRequired, MIN_REJECT_COMMENT } from '../ext-guarantees/rejectRules'
import type { Req } from './types'

export function RequestDecision({ request }: { request: Req }) {
  const [decision, setDecision] = useState('Approved')
  const [comment, setComment] = useState('')
  const [reasonCode, setReasonCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sending = useRef(false)
  const required = useRejectReasonRequired()
  const invalid = !comment.trim() || (decision === 'Rejected' && required && (!reasonCode || comment.trim().length < MIN_REJECT_COMMENT))
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (sending.current || invalid) return
    sending.current = true; setBusy(true); setError(null)
    const r = await api.post(`/requests/${request.id}/decide`, { decision, comment, expectedVersion: request.version, ...(decision === 'Rejected' && reasonCode ? { reasonCode } : {}) })
    sending.current = false; setBusy(false)
    if (!r.ok) setError(r.problem.message)
  }
  return <section className="decision-panel"><h2>Решение по заявке</h2><form onSubmit={submit}>
    <label className="comment-field"><span>Решение</span><select value={decision} onChange={e => setDecision(e.target.value)} disabled={busy}><option value="Approved">Ответить / согласовать</option><option value="Rejected">Отклонить</option></select></label>
    <label className="comment-field"><span>{decision === 'Rejected' ? 'Причина отклонения' : 'Ответ сотруднику'}</span><textarea required maxLength={2000} value={comment} onChange={e => setComment(e.target.value)} disabled={busy} /></label>
    {decision === 'Rejected' && <RejectReason type={request.type} value={reasonCode} onChange={setReasonCode} disabled={busy} />}
    {error && <p role="alert" className="field-error">{error}</p>}
    <Button disabled={busy || invalid} type="submit">Сохранить решение</Button>
  </form></section>
}
