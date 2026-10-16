import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'

export function NotificationLink() {
  const services = useServices()
  const query = useServiceQuery(services.notifications.listMine)
  const count = query.data?.items.filter((item) => !item.readAt).length ?? 0
  return <Link to="/notifications" className="notification-link icon-button" aria-label={query.problem ? 'Уведомления — не удалось обновить' : `Уведомления — ${count} новых`}><Bell size={21} strokeWidth={1.6} aria-hidden="true" /><span className="notification-count" data-unread={count > 0} aria-hidden="true">{query.problem ? '!' : count > 99 ? '99+' : count}</span><span className="sr-only" role="status">{count > 0 ? `Новых уведомлений: ${count}` : ''}</span></Link>
}
