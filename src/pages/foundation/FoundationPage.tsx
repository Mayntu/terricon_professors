import { useEffect } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { Reveal } from '@/components/motion/Reveal'
import { plannedScreens } from '@/app/routes'

export function FoundationPage() {
  useEffect(() => { document.title = 'JanaМен · Основа JANA FLOW' }, [])

  return (
    <>
      <Reveal>
        <section className="flow-grid foundation-intro" aria-labelledby="foundation-title">
          <div className="foundation-heading">
            <p className="eyebrow text-brand">Единое пространство сотрудника</p>
            <h1 id="foundation-title" className="type-display">Сначала —<br />прочная основа<span className="text-brand">.</span></h1>
          </div>
          <div className="foundation-note">
            <span className="stage-label"><span className="status-dot" /> Основа подготовлена</span>
            <p>Здесь начинается JanaМен. Визуальный язык, маршруты и границы модулей готовы к последовательной разработке.</p>
            <p className="text-muted">Продуктовые экраны появятся на следующих этапах.</p>
            <a href="#screen-map" className="text-link">Карта будущих экранов <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </section>
      </Reveal>
      <section id="screen-map" className="foundation-map" aria-labelledby="map-title">
        <div className="section-heading">
          <h2 id="map-title" className="type-title">Маршруты развития</h2>
          <span className="eyebrow text-muted">Все экраны · Запланировано</span>
        </div>
        <p className="map-description text-muted">Ссылки открывают технические заглушки. Формы, данные и авторизация ещё не реализованы.</p>
        <ul className="route-list">
          {plannedScreens.filter((screen) => !screen.path.includes(':') && screen.id !== 'forbidden').map((screen, index) => (
            <li key={screen.id}>
              <Link to={screen.path} className="route-link">
                <span className="eyebrow text-muted">{String(index + 1).padStart(2, '0')}</span>
                <span>{screen.title}</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
