import { useEffect } from 'react'
import { ArrowUpRight, Route } from 'lucide-react'
import { Link } from 'react-router'
import type { PlannedScreen } from '@/app/routes'
import { Reveal } from '@/components/motion/Reveal'
import { useDemoSession } from '@/features/identity/demo-context'
import { getDemoRole } from '@/features/identity/demo-roles'

export function PlannedPage({ screen }: { screen: PlannedScreen }) {
  useEffect(() => { document.title = `${screen.title} · JanaМен` }, [screen.title])
  const { role } = useDemoSession()
  const forbidden = screen.id === 'forbidden'

  return (
    <Reveal key={screen.id}>
      <section className="workspace-placeholder" aria-labelledby="planned-title">
        <div className="workspace-page-heading"><p className="eyebrow">{role ? getDemoRole(role).description : 'Ваше пространство'} <span>/ JANA FLOW</span></p><h1 id="planned-title">{screen.title}<span className="heading-dot">.</span></h1><p>Меньше формальностей. Больше внимания важному.</p></div>
        <div className="reserved-workspace">
          <div className="reserved-topline"><span className="eyebrow">{forbidden ? 'ДРУГОЕ ПРОСТРАНСТВО' : 'СЛЕДУЮЩАЯ ОСТАНОВКА'}</span><Route size={24} strokeWidth={1.25} aria-hidden="true" /></div>
          <div className="reserved-content"><span className="reserved-symbol" aria-hidden="true">↳</span><div><h2>{forbidden ? 'У этой роли другой маршрут' : 'Здесь будет ваше рабочее пространство'}</h2><p>{forbidden ? 'Этот раздел не включён в выбранную демо-роль. Переключить роль можно в меню профиля.' : 'Раздел появится на следующем этапе. А пока можно познакомиться с навигацией и выбрать другую демо-роль.'}</p>{forbidden && <Link to="/" className="text-link">В своё пространство <ArrowUpRight size={18} aria-hidden="true" /></Link>}</div></div>
          <div className="reserved-bottomline"><span>JanaМен · Демонстрационная версия</span><span className="eyebrow">{forbidden ? 'МАРШРУТ ОГРАНИЧЕН' : 'В РАЗРАБОТКЕ'}</span></div>
        </div>
        <div className="workspace-margin-note"><span className="editorial-rule" /><p>Хорошие процессы оставляют время для людей.</p></div>
      </section>
    </Reveal>
  )
}
