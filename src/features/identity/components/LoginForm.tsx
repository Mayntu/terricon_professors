import { useEffect, useState, type FormEvent } from 'react'
import { useDemoSession } from '../demo-context'
import { api } from '@/services/http/client'
import { DemoLoginForm } from './DemoLoginForm'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const { enterPassword } = useDemoSession()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoAllowed, setDemoAllowed] = useState(false)
  const [demo, setDemo] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    void api.get<{ demoMode: boolean }>('/auth/config', { signal: controller.signal }).then(r => { if (r.ok) setDemoAllowed(r.data.demoMode) }, () => {})
    return () => controller.abort()
  }, [])
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(null)
    const r = await enterPassword(login.trim(), password)
    setBusy(false)
    if (!r.ok) setError(r.problem.message)
  }
  return <div>
    {demo && demoAllowed ? <DemoLoginForm /> : <form className="demo-login-form ext-form" aria-label="Вход по паролю" onSubmit={submit}>
      <label className="comment-field js-form-reveal"><span>Логин</span><input name="username" autoComplete="username" required value={login} onChange={e => setLogin(e.target.value)} /></label>
      <label className="comment-field js-form-reveal"><span>Пароль</span><input name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="login-cta js-form-reveal" type="submit" disabled={busy} aria-busy={busy}><span className="cta-sweep" aria-hidden="true" /><span>{busy ? 'Входим…' : 'Войти'}</span></button>
    </form>}
    {demoAllowed && <Button variant="quiet" onClick={() => { setDemo(!demo); setPassword(''); setError(null) }}>{demo ? 'Вход по паролю' : 'Демонстрационный вход'}</Button>}
  </div>
}
