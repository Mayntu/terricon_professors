import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'
import type { PlannedScreen } from '@/app/routes'

export function PlannedPage({ screen }: { screen: PlannedScreen }) {
  useEffect(() => { document.title = `${screen.title} · JanaМен` }, [screen.title])

  return (
    <section className="placeholder-page" aria-labelledby="planned-title">
      <p className="eyebrow text-brand">JANA FLOW · Экран запланирован</p>
      <h1 id="planned-title" className="type-page-title">{screen.title}</h1>
      <p>Маршрут зарезервирован. Разработка этого экрана начнётся на отдельном этапе.</p>
      <p className="text-muted">Это техническая заглушка, без данных и проверки прав доступа.</p>
      <code className="route-path">{screen.path}</code>
      <Link to="/" className="text-link"><ArrowLeft size={18} aria-hidden="true" /> К основе проекта</Link>
    </section>
  )
}
