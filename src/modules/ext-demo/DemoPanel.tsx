import { useState } from 'react'
import { FlaskConical, X } from 'lucide-react'
import { api, revisionStore } from '@/services/http/client'
import { signInPersona } from '@/services/http/services'
import { browserDemoSessionStore } from '@/mocks/demo-session'
import { registerDictionary, useT } from '../ext-core/i18n'
import { dateTime } from '../ext-core/format'
import { useSettings } from '../ext-core/settings'

registerDictionary(
  { 'demo.open': 'Демо-панель', 'demo.title': 'Демо-режим', 'demo.as': 'Войти как', 'demo.plus2': '+2 дня', 'demo.reset': 'Сброс данных', 'demo.now': 'Время платформы: {date}', 'demo.done': 'Готово' },
  { 'demo.open': 'Демо-панель', 'demo.title': 'Демо-режим', 'demo.as': 'Кіру', 'demo.plus2': '+2 күн', 'demo.reset': 'Деректерді тастау', 'demo.now': 'Платформа уақыты: {date}', 'demo.done': 'Дайын' },
)

const PERSONAS = [
  ['aigerim', 'Айгерим', 'сотрудник'], ['nurlan', 'Нурлан', 'сотрудник'], ['asel', 'Асель', 'сотрудник'], ['erlan', 'Ерлан', 'руководитель'],
  ['gulnara', 'Гульнара', 'руководитель'], ['daniyar', 'Данияр', 'HR'], ['bakyt', 'Бакыт', 'сотрудник KG'], ['aibek', 'Айбек', 'руководитель KG'],
] as const

/** Плавающая демо-панель (только при DEMO_MODE): быстрый вход за персонажей, перевод времени, сброс. */
export default function DemoPanel() {
  const t = useT()
  const { demoMode } = useSettings()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState<string | null>(null)
  if (!demoMode) return null

  async function as(login: string) {
    setBusy(true)
    const r = await signInPersona(browserDemoSessionStore, login)
    if (r.ok) window.location.assign('/dashboard')
    else setBusy(false)
  }
  async function call(path: string, body?: unknown) {
    setBusy(true)
    const r = await api.post<{ now: string }>(path, body)
    setBusy(false)
    if (r.ok) { setNow(r.data.now); revisionStore.bump() }
  }
  if (!open) return <button type="button" className="ext-demo-fab" onClick={() => setOpen(true)} aria-label={t('demo.open')}><FlaskConical size={18} aria-hidden="true" />DEMO</button>
  return <aside className="ext-demo-panel" aria-label={t('demo.title')} data-testid="demo-panel">
    <div className="ext-row ext-row--between"><span className="eyebrow">{t('demo.title')}</span><button type="button" className="ext-demo-close" onClick={() => setOpen(false)} aria-label={t('common.close')}><X size={16} aria-hidden="true" /></button></div>
    <span className="eyebrow">{t('demo.as')}</span>
    <div className="ext-demo-personas">{PERSONAS.map(([login, name, role]) => <button key={login} type="button" disabled={busy} onClick={() => void as(login)}><strong>{name}</strong><small>{role}</small></button>)}</div>
    <div className="ext-demo-actions"><button type="button" disabled={busy} onClick={() => void call('/demo/advance-time', { hours: 48 })}>{t('demo.plus2')}</button><button type="button" disabled={busy} onClick={() => void call('/demo/reset')}>{t('demo.reset')}</button></div>
    {now && <p className="ext-muted" role="status">{t('demo.now', { date: dateTime(now) })}</p>}
  </aside>
}
