import { useT } from '@/modules/ext-core/main-i18n'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { LeaveForm } from '@/features/leave/components/LeaveForm'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'

export default function LeavePage() {
  const t = useT()
  const services = useServices()
  const query = useServiceQuery(services.profiles.getMyProfile)
  return <div className="business-page"><Link className="back-link" to="/requests"><ArrowLeft size={16} aria-hidden="true" />{t('Мои заявки')}</Link><WorkspaceHeading index={t('L–01 / НОВАЯ ЗАЯВКА')} title={t('Планы на паузу')}>{t('Отдых начинается с простого, понятного маршрута.')}</WorkspaceHeading>{query.data ? <LeaveForm profile={query.data} /> : <QueryState problem={query.problem} retry={query.refresh} />}</div>
}
