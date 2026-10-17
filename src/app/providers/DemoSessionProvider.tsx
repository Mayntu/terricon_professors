import { useEffect, useState, type PropsWithChildren } from 'react'
import { DemoSessionContext } from '@/features/identity/demo-context'
import type { User, Role } from '@/features/identity/model'
import type { IAuthService } from '@/services/contracts'

export function DemoSessionProvider({ auth, children }: PropsWithChildren<{ auth: IAuthService }>) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void auth.getCurrentUser().then((result) => {
      if (!active) return
      if (result.ok) setUser(result.data)
      else setError(result.problem.message)
      setReady(true)
    })
    return () => { active = false }
  }, [auth])

  useEffect(() => {
    const expired = () => { setUser(null); setError(null) }
    window.addEventListener('jana:session-expired', expired)
    return () => window.removeEventListener('jana:session-expired', expired)
  }, [])
  async function enterPassword(login: string, password: string) {
    const result = await auth.signIn(login, password)
    if (result.ok) setUser(result.data)
    return result
  }
  async function enterDemo(role: Role) {
    const result = await auth.signInDemo(role)
    if (result.ok) setUser(result.data)
    return result
  }
  async function leaveDemo() {
    const result = await auth.signOut()
    if (result.ok) setUser(null)
  }
  if (!ready) return <div className="route-loading" role="status">Открываем ваше пространство…</div>
  if (error) return <div className="route-loading"><div role="alert"><p>{error}</p><button className="button button--secondary" onClick={() => { void leaveDemo(); setError(null) }}>Вернуться ко входу</button></div></div>
  return <DemoSessionContext value={{ role: user?.role ?? null, user, enterPassword, enterDemo, leaveDemo }}>{children}</DemoSessionContext>
}
