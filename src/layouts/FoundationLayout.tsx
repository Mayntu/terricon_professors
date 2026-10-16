import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'

/** Temporary development shell. The product shell is a separate future step. */
export function FoundationLayout() {
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      mainRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
      previousPath.current = pathname
    }
  }, [pathname])

  return (
    <div className="foundation-shell">
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <header className="shell-header page-container">
        <Link to="/" aria-label="JanaМен — основа проекта"><Wordmark /></Link>
        <span className="eyebrow text-muted">JANA FLOW <span aria-hidden="true">/</span> 00</span>
      </header>
      <main id="main-content" ref={mainRef} tabIndex={-1} className="page-container shell-main">
        <Outlet />
      </main>
      <footer className="page-container shell-footer">
        <span className="eyebrow">Human-Centered Operations Interface</span>
        <span>Этап 01 · Основа интерфейса</span>
      </footer>
    </div>
  )
}
