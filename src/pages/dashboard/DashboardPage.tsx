import { useT } from '@/modules/ext-core/main-i18n'
import { AnimatedValue } from '@/components/motion/AnimatedValue'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { QueryState } from '@/components/ui/QueryState'
import { useServices } from '@/services/context'
import { useServiceQuery } from '@/services/useServiceQuery'
import { JanaFlowMap } from '@/features/leave/components/JanaFlowMap'
import { StatusBadge } from '@/features/leave/components/StatusBadge'
import { formatDate } from '@/features/leave/dates'
import { apiEnabled } from '@/services/http/client'
import { ExtSlot } from '@/modules'

export default function DashboardPage() {
  const t = useT()
  const services = useServices()
  const profile = useServiceQuery(services.profiles.getMyProfile)
  const requests = useServiceQuery(services.leaveRequests.listMine)
  const latest = requests.data?.items.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt) || b.number.localeCompare(a.number))[0]
  return <div className="business-page"><WorkspaceHeading index={t('01 / ЛИЧНОЕ')} title={t('Личный кабинет')}>{t('Ваш рабочий день. Ваши планы. Всё на своём месте.')}</WorkspaceHeading>
    {profile.data ? <section className="profile-overview"><div className="profile-intro"><span className="eyebrow">{t('РАДЫ ВАС ВИДЕТЬ')}</span><h2>{profile.data.displayName}</h2><p>{profile.data.position} / {profile.data.department}</p><Link className="text-link" to="/profile">{t('Мой профиль')} <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="leave-balance"><span className="eyebrow">{(apiEnabled ? t('ВАШ ОСТАТОК ОТПУСКА') : t('ВАШ ТЕСТОВЫЙ ОСТАТОК'))}</span><p><strong data-testid="leave-balance"><AnimatedValue value={profile.data.leaveBalance.days} /></strong><span>{t('календ.')}<br />{t('дней')}</span></p><Link className="button button--primary" to="/requests/new/leave">{t('Оформить отпуск')} <ArrowUpRight size={18} aria-hidden="true" /></Link><small>{t('С учётом резерва по активным заявкам')}</small></div></section> : <QueryState problem={profile.problem} retry={profile.refresh} />}
    <section className="dashboard-route"><div className="section-heading"><div><span className="eyebrow">{t('02 / В ДВИЖЕНИИ')}</span><h2>{t('Ваш последний маршрут')}</h2></div><Link className="text-link" to="/requests">{t('Все заявки')} <ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      {requests.data ? latest ? <><div className="latest-request"><Link className="request-number" to={`/requests/${latest.id}`}>{latest.number}<ArrowUpRight size={16} aria-hidden="true" /></Link><span>{formatDate(latest.startDate)} — {formatDate(latest.endDate)}</span><StatusBadge status={latest.status} /></div><JanaFlowMap request={latest} compact /></> : <div className="dashboard-empty"><span className="empty-route-symbol" aria-hidden="true">01 ─── ○</span><div><h3>{t('Место для ваших планов')}</h3><p>{t('После отправки заявки здесь появится её маршрут — от первого шага до решения.')}</p></div></div> : <QueryState problem={requests.problem} retry={requests.refresh} />}
    </section><ExtSlot name="home.widgets" /><p className="demo-footnote">{apiEnabled ? t('Профиль и заявки сохраняются на сервере. Интеграции 1С, Documentolog и банка работают в mock-режиме.') : t('Демонстрационные профили и заявки сохраняются в этом браузере. Реальные кадровые операции не выполняются.')}</p>
  </div>
}
