import { useEffect } from 'react'
import { Link } from 'react-router'

export function NotFoundPage() {
  useEffect(() => { document.title = 'Страница не найдена · JanaМен' }, [])

  return (
    <section className="placeholder-page" aria-labelledby="not-found-title">
      <p className="eyebrow text-brand">404 · Вне маршрута</p>
      <h1 id="not-found-title" className="type-page-title">Страница не найдена</h1>
      <p>Проверьте адрес или вернитесь к карте будущих экранов.</p>
      <Link to="/" className="text-link">В своё пространство</Link>
    </section>
  )
}
