import { NavLink } from 'react-router'
import type { Role } from '@/features/identity/model'
import { getNavigation } from '../navigation'

export function AppNavigation({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  return (
    <nav className="app-navigation" aria-label="Основная навигация">
      {getNavigation(role).map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-group-label">{group.label}</p>
          <ul>
            {group.items.map(({ path, label, icon: Icon, index, end }) => (
              <li key={path}><NavLink to={path} end={end ?? false} onClick={onNavigate} className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}>
                <Icon size={19} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span><span className="nav-index" aria-hidden="true">{index}</span>
              </NavLink></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
