import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Check } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { Button } from '@/components/ui/Button'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'
import { formatTimestamp } from '@/features/leave/dates'

export default function NotificationsPage() {
  const services = useServices()
  const query = useServiceQuery(services.notifications.listMine)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const items = query.data?.items.filter((item) => !unreadOnly || !item.readAt)
  async function markRead(id: string) {
    setBusy(id)
    setError(null)
    const result = await services.notifications.markRead(id)
    if (!result.ok) setError(result.problem.message)
    setBusy(null)
  }
  return <div className="business-page"><WorkspaceHeading index="03 / ВХОДЯЩИЕ" title="Уведомления">Решения по вашим заявкам — всегда под рукой.</WorkspaceHeading>{items ? <><div className="notifications-toolbar"><span className="eyebrow">НЕПРОЧИТАННЫХ: {query.data?.items.filter((item) => !item.readAt).length}</span><label><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />Только непрочитанные</label></div>{error && <p className="field-error" role="alert">{error}</p>}{items.length ? <ul className="notifications-list">{items.map((item) => <li key={item.id} data-unread={!item.readAt}><span className="notification-marker" aria-hidden="true" /><div><time dateTime={item.createdAt}>{formatTimestamp(item.createdAt)}</time><h2>{item.title}</h2><p>{item.message}</p><Link className="text-link" to={item.target.kind === 'request' ? `/requests/${item.target.requestId}` : `/academy/${item.target.courseId}`}>Посмотреть заявку <ArrowUpRight size={16} aria-hidden="true" /></Link></div>{item.readAt ? <span className="notification-read"><Check size={16} aria-hidden="true" />Прочитано</span> : <Button variant="quiet" disabled={busy !== null} onClick={() => markRead(item.id)}>Отметить прочитанным</Button>}</li>)}</ul> : <div className="register-empty"><span aria-hidden="true">↗</span><h2>{unreadOnly ? 'Всё прочитано' : 'Вы ничего не пропустили'}</h2><p>После решения руководителя здесь появится уведомление.</p></div>}</> : <QueryState problem={query.problem} retry={query.refresh} />}</div>
}
