import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'
import { RequestList } from '@/features/leave/components/RequestList'
import { apiEnabled } from '@/services/http/client'
import { useT } from '@/modules/ext-core/main-i18n'

export default function RequestsPage({ manager = false }: { manager?: boolean }) {
  const t = useT()
  const services = useServices()
  const query = useServiceQuery(manager ? services.leaveRequests.listTeam : services.leaveRequests.listMine)
  const pending = query.data?.items.filter((request) => request.status === 'Submitted').length ?? 0
  return <div className="business-page"><div className="page-heading-row"><WorkspaceHeading index={manager ? t('02 / КОМАНДА') : t('02 / РЕЕСТР')} title={manager ? t('Согласование заявок') : t('Мои заявки')}>{manager ? t('Решения, которые помогают команде двигаться дальше.') : t('Каждая заявка — понятный маршрут от отправки до решения.')}</WorkspaceHeading>{!manager && <Link className="button button--primary" to="/requests/new/leave">{t('Оформить отпуск')} <ArrowUpRight size={18} aria-hidden="true" /></Link>}</div>
    {manager && <div className="queue-intro"><strong>{String(pending).padStart(2, '0')}</strong><p>{t('ожидают вашего решения')}<span>{apiEnabled ? t('Заявки сотрудников вашей команды') : t('Заявки сотрудников вашей демо-команды')}</span></p><span className="eyebrow">MANAGER QUEUE / 01</span></div>}
    {query.data ? <RequestList requests={query.data.items} manager={manager} /> : <QueryState problem={query.problem} retry={query.refresh} />}
    {manager && <p className="demo-footnote">{(apiEnabled ? t('Доступ проверяет сервер: вы видите только заявки своей команды.') : t('Принадлежность команде проверяет mock-сервис. Это демонстрация процесса, а не серверная защита доступа.'))}</p>}
  </div>
}
