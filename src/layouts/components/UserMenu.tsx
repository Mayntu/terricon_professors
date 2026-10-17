import { LangSwitch } from '@/modules/ext-core/ui'
import { useT } from '@/modules/ext-core/main-i18n'
import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeftRight, ChevronDown, LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { useDemoSession } from '@/features/identity/demo-context'
import { getDemoRole } from '@/features/identity/demo-roles'
import { apiEnabled } from '@/services/http/client'
import { useSettings } from '@/modules/ext-core/settings'
import type { Role } from '@/features/identity/model'

export function UserMenu({ role }: { role: Role }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const reduceMotion = useReducedMotion()
  const { leaveDemo, user } = useDemoSession()
  const settings = useSettings()
  const demo = !apiEnabled || settings.demoMode
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  async function exitDemo() { setOpen(false); await leaveDemo(); navigate('/login', { replace: true }) }

  return (
    <div className="user-menu" ref={container} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button ref={trigger} type="button" className="user-menu-trigger" aria-expanded={open} aria-controls={id} aria-label={demo ? t('Меню демо-профиля') : t('Меню профиля')} onClick={() => setOpen(!open)}>
        <span className="demo-avatar" aria-hidden="true">{apiEnabled && user ? user.displayName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'JМ'}</span><span className="user-menu-copy"><strong>{apiEnabled ? user?.displayName : t('Демо-профиль')}</strong><span>{t(getDemoRole(role).label)}</span></span><ChevronDown size={15} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && <motion.div id={id} className="user-popover" initial={reduceMotion ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : 0.16 }}>
          <div className="user-popover-heading"><LangSwitch /><span className="eyebrow">{demo ? t('Демонстрационный режим') : t('Личный кабинет')}</span><p>{t('Роль: {role}', { role: t(getDemoRole(role).label) })}</p></div>
          <Link to="/profile" onClick={() => setOpen(false)}><UserRound size={17} aria-hidden="true" />{t('Мой профиль')}</Link>
          {demo && <button type="button" onClick={exitDemo}><ArrowLeftRight size={17} aria-hidden="true" />{t('Сменить демо-роль')}</button>}
          <button type="button" className="user-logout" onClick={exitDemo}><LogOut size={17} aria-hidden="true" />{demo ? t('Выйти из демо') : t('Выйти')}</button>
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}
