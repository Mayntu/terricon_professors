import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, UsersRound, UserRound, ScanFace } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useDemoSession } from '../demo-context'
import { demoRoles, getDemoRole } from '../demo-roles'
import type { Role } from '../model'

const roleIcons = { Employee: UserRound, Manager: UsersRound, HRAdmin: ScanFace }

export function DemoLoginForm() {
  const [selectedRole, setSelectedRole] = useState<Role>('Employee')
  const { enterDemo } = useDemoSession()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    const result = await enterDemo(selectedRole)
    if (result.ok) navigate(getDemoRole(selectedRole).home, { replace: true })
    else { setError(result.problem.message); setBusy(false) }
  }

  return (
    <form className="demo-login-form" onSubmit={handleSubmit} aria-label="Демонстрационный вход">
      <fieldset className="role-fieldset js-form-reveal" aria-describedby="demo-disclaimer">
        <legend><span className="eyebrow">Выберите ваше пространство</span><span className="demo-tag">ДЕМО</span></legend>
        <div className="role-options">
          {demoRoles.map((item) => {
            const Icon = roleIcons[item.id]
            return (
              <label className="role-option" key={item.id}>
                <input type="radio" name="demo-role" value={item.id} checked={selectedRole === item.id} onChange={() => setSelectedRole(item.id)} />
                <span className="role-option-content">
                  <span className="role-option-top"><Icon size={19} strokeWidth={1.5} aria-hidden="true" /><Check className="role-check" size={14} aria-hidden="true" /></span>
                  <span className="role-option-label">{item.label}</span>
                  <span className="role-option-description">{item.description}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <div className="js-form-reveal">
        {error && <p role="alert">{error}</p>}
        <button className="login-cta" type="submit" disabled={busy} aria-busy={busy}>
          <span className="cta-sweep" aria-hidden="true" />
          <span>Войти в пространство</span><ArrowUpRight size={23} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <p id="demo-disclaimer" className="demo-disclaimer">Без пароля. Только демонстрационные данные.</p>
      </div>
    </form>
  )
}
