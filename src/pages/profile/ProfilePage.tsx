import { useT } from '@/modules/ext-core/main-i18n'
import { Link } from 'react-router'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'
import { formatDate } from '@/features/leave/dates'
import { ExtSlot } from '@/modules'

export default function ProfilePage() {
  const t = useT()
  const services = useServices()
  const query = useServiceQuery(services.profiles.getMyProfile)
  const profile = query.data
  return <div className="business-page"><WorkspaceHeading index={t('01 / ПРОФИЛЬ')} title={t('Профиль сотрудника')}>{t('Вымышленные данные для демонстрации сценария.')}</WorkspaceHeading>{profile ? <div className="profile-sheet"><h2>{profile.displayName}</h2><dl className="request-facts"><div><dt>{t('Компания')}</dt><dd>{profile.company}</dd></div><div><dt>{t('Должность')}</dt><dd>{profile.position}</dd></div><div><dt>{t('Команда')}</dt><dd>{profile.department}</dd></div><div><dt>{t('Руководитель')}</dt><dd>{profile.manager?.displayName ?? t('Не назначен')}</dd></div><div><dt>{t('Дата начала работы')}</dt><dd>{formatDate(profile.hiredOn)}</dd></div><div><dt>{t('Тестовый остаток')}</dt><dd>{profile.leaveBalance.days} {t('календ. дн.')} {t('на')} {formatDate(profile.leaveBalance.asOf)}</dd></div></dl><Link className="button button--primary" to="/requests/new/leave">{t('Оформить отпуск')}</Link><p className="demo-footnote">{t('Профиль доступен только для чтения. Остаток учитывает согласованные отпуска и резерв по заявкам на согласовании, включая переданные HR.')}</p></div> : <QueryState problem={query.problem} retry={query.refresh} />}<ExtSlot name="profile.sections" /></div>
}
