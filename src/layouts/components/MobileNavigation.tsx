import { useEffect, useRef, useState } from 'react'
import { ClipboardList, GraduationCap, House, Menu, X } from 'lucide-react'
import { NavLink } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import type { Role } from '@/features/identity/model'
import { AppNavigation } from './AppNavigation'

export function MobileNavigation({ role }: { role: Role }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const shouldReturnFocus = useRef(true)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    function closeOnDesktop() { if (media.matches) dialog.current?.close() }
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])

  function showNavigation() { shouldReturnFocus.current = true; dialog.current?.showModal(); setOpen(true) }
  function closeNavigation() { dialog.current?.close() }
  function followRoute() { shouldReturnFocus.current = false; closeNavigation() }

  return (
    <>
      <nav className="mobile-dock" aria-label="Быстрая навигация">
        <NavLink to="/dashboard"><House size={20} aria-hidden="true" /><span>Мой день</span></NavLink>
        <NavLink to="/requests"><ClipboardList size={20} aria-hidden="true" /><span>Заявки</span></NavLink>
        <NavLink to="/academy"><GraduationCap size={20} aria-hidden="true" /><span>Academy</span></NavLink>
        <button type="button" ref={trigger} aria-haspopup="dialog" aria-expanded={open} onClick={showNavigation}><Menu size={20} aria-hidden="true" /><span>Все разделы</span></button>
      </nav>
      <dialog className="mobile-navigation-dialog" ref={dialog} aria-labelledby="mobile-navigation-title" onClose={() => { setOpen(false); if (shouldReturnFocus.current) trigger.current?.focus() }} onClick={(event) => { if (event.target === event.currentTarget) closeNavigation() }}>
        <div className="mobile-navigation-sheet">
          <div className="mobile-navigation-header"><Wordmark /><button className="icon-button" type="button" onClick={closeNavigation} aria-label="Закрыть навигацию"><X size={22} /></button></div>
          <h2 id="mobile-navigation-title" className="mobile-navigation-title">Ваши маршруты</h2>
          <AppNavigation role={role} onNavigate={followRoute} />
          <p className="mobile-navigation-footnote">Демо-пространство · Без персональных данных</p>
        </div>
      </dialog>
    </>
  )
}
