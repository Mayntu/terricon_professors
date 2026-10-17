import { useEffect, useState, type FormEvent } from 'react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { Button } from '@/components/ui/Button'
import { api } from '@/services/http/client'
import { useDemoSession } from '@/features/identity/demo-context'
import { registerDictionary, useT } from '../ext-core/i18n'
import { useApi } from '../ext-core/useApi'
import { money, shortDate, todayAlmaty } from '../ext-core/format'
import { ExtState, LangSwitch, Pill } from '../ext-core/ui'

registerDictionary(
  { 'sh.title': 'Биржа смен', 'sh.nav': 'Биржа смен', 'sh.index': 'СМЕНЫ / БИРЖА', 'sh.lead': 'Меняйтесь сменами без звонков начальнику. Система сама проверит квалификацию и пересечения, руководитель увидит обмен.',
    'sh.mine': 'Мои смены', 'sh.noMine': 'Ближайших смен нет', 'sh.available': 'Можно взять', 'sh.noAvailable': 'Свободных смен нет', 'sh.noAvailableText': 'Когда коллега отдаст смену или руководитель откроет дополнительную — она появится здесь.',
    'sh.give': 'Отдать смену', 'sh.cancelGive': 'Оставить себе', 'sh.take': 'Взять · +{pay}', 'sh.offered': 'Выставлена на биржу', 'sh.open': 'Открытая смена', 'sh.from': 'Отдаёт: {name}',
    'sh.publish': 'Открыть дополнительную смену', 'sh.date': 'Дата', 'sh.start': 'Начало', 'sh.end': 'Конец', 'sh.pay': 'Оплата за смену', 'sh.published': 'Смена опубликована',
    'sh.team': 'Смены центра', 'sh.history': 'История', 'sh.event.offered': 'выставил(а)', 'sh.event.taken': 'взял(а)', 'sh.event.published': 'опубликовал(а)', 'sh.event.offer_cancelled': 'вернул(а) себе', 'sh.free': 'свободна' },
  { 'sh.title': 'Ауысым биржасы', 'sh.nav': 'Ауысым биржасы', 'sh.index': 'АУЫСЫМ / БИРЖА', 'sh.lead': 'Басшыға қоңырау шалмай ауысымдармен алмасыңыз. Жүйе біліктілік пен қиылысуды өзі тексереді.',
    'sh.mine': 'Менің ауысымдарым', 'sh.noMine': 'Жақын ауысым жоқ', 'sh.available': 'Алуға болады', 'sh.noAvailable': 'Бос ауысым жоқ', 'sh.noAvailableText': 'Әріптес ауысымын бергенде немесе басшы қосымша ашқанда — осында пайда болады.',
    'sh.give': 'Ауысымды беру', 'sh.cancelGive': 'Өзіме қалдыру', 'sh.take': 'Алу · +{pay}', 'sh.offered': 'Биржаға қойылды', 'sh.open': 'Ашық ауысым', 'sh.from': 'Береді: {name}',
    'sh.publish': 'Қосымша ауысым ашу', 'sh.date': 'Күні', 'sh.start': 'Басы', 'sh.end': 'Соңы', 'sh.pay': 'Ауысым төлемі', 'sh.published': 'Ауысым жарияланды',
    'sh.team': 'Орталық ауысымдары', 'sh.history': 'Тарих', 'sh.event.offered': 'қойды', 'sh.event.taken': 'алды', 'sh.event.published': 'жариялады', 'sh.event.offer_cancelled': 'қайтарды', 'sh.free': 'бос' },
)

interface Shift { id: string; centerName: string; date: string; startTime: string; endTime: string; qualification: string; status: 'assigned' | 'offered' | 'open' | 'taken'; assigneeName: string | null; payPreview: number | null; mine: boolean }
interface TeamShift extends Shift { history: { at: string; event: string; actorName: string | null }[] }
const when = (s: Shift) => `${shortDate(s.date)} · ${s.startTime}–${s.endTime}`

export default function ShiftsPage() {
  const t = useT()
  const { user } = useDemoSession()
  const manager = user?.role === 'Manager' || user?.role === 'HRAdmin'
  useEffect(() => { document.title = `${t('sh.title')} · JanaМен` }, [t])
  return <div className="business-page">
    <WorkspaceHeading index={t('sh.index')} title={t('sh.title')}>{t('sh.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><span /><LangSwitch /></div>
    {user?.role !== 'HRAdmin' && <><MyShifts /><Available /></>}
    {manager && <><Publish hr={user?.role === 'HRAdmin'} /><Team /></>}
  </div>
}

function MyShifts() {
  const t = useT()
  const q = useApi<{ items: Shift[] }>('/ext/shifts/my')
  const [problem, setProblem] = useState<string | null>(null)
  async function act(s: Shift, action: 'offer' | 'cancel-offer') { const r = await api.post(`/ext/shifts/${s.id}/${action}`); setProblem(r.ok ? null : r.problem.message) }
  return <section className="ext-section"><span className="eyebrow">01</span><h2>{t('sh.mine')}</h2>
    {problem && <p className="field-error" role="alert">{problem}</p>}
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.items.length} emptyTitle={t('sh.noMine')}>
      <ul className="ext-list" data-testid="shifts-mine">{q.data?.items.map((s) => <li key={s.id} data-shift={s.id}><div><strong>{when(s)}</strong><span className="ext-muted">{s.centerName}</span>{s.status === 'offered' && <Pill tone="info">{t('sh.offered')}</Pill>}</div>
        {s.status === 'offered' ? <Button variant="quiet" onClick={() => void act(s, 'cancel-offer')}>{t('sh.cancelGive')}</Button> : <Button variant="secondary" onClick={() => void act(s, 'offer')}>{t('sh.give')}</Button>}</li>)}</ul>
    </ExtState></section>
}

function Available() {
  const t = useT()
  const q = useApi<{ items: Shift[] }>('/ext/shifts/available')
  const [problem, setProblem] = useState<string | null>(null)
  async function take(s: Shift) { const r = await api.post(`/ext/shifts/${s.id}/take`); setProblem(r.ok ? null : r.problem.message) }
  return <section className="ext-section"><span className="eyebrow">02</span><h2>{t('sh.available')}</h2>
    {problem && <p className="field-error" role="alert">{problem}</p>}
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.items.length} emptyTitle={t('sh.noAvailable')} emptyText={t('sh.noAvailableText')}>
      <ul className="ext-list" data-testid="shifts-available">{q.data?.items.map((s) => <li key={s.id} data-shift={s.id}><div><strong>{when(s)}</strong><span className="ext-muted">{s.centerName}</span>
        {s.status === 'open' ? <Pill tone="warning">{t('sh.open')}</Pill> : s.assigneeName && <span className="ext-muted">{t('sh.from', { name: s.assigneeName })}</span>}</div>
        <Button onClick={() => void take(s)}>{t('sh.take', { pay: money(s.payPreview ?? 0) })}</Button></li>)}</ul>
    </ExtState></section>
}

function Publish({ hr }: { hr: boolean }) {
  const t = useT()
  const [f, setF] = useState({ date: todayAlmaty(), startTime: '08:00', endTime: '20:00', payPreview: '12000', centerId: 'kz-almaty-sc' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function submit(e: FormEvent) {
    e.preventDefault()
    const r = await api.post('/ext/shifts', { date: f.date, startTime: f.startTime, endTime: f.endTime, payPreview: Number(f.payPreview), ...(hr ? { centerId: f.centerId } : {}) })
    setMsg(r.ok ? { ok: true, text: t('sh.published') } : { ok: false, text: r.problem.message })
  }
  return <section className="ext-section"><span className="eyebrow">03</span><h2>{t('sh.publish')}</h2>
    <form className="ext-form ext-policy-fields" style={{ display: 'grid' }} onSubmit={submit} data-testid="shift-publish">
      <label><span>{t('sh.date')}</span><input type="date" min={todayAlmaty()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
      <label><span>{t('sh.start')}</span><input type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></label>
      <label><span>{t('sh.end')}</span><input type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} /></label>
      <label><span>{t('sh.pay')}</span><input inputMode="numeric" value={f.payPreview} onChange={(e) => setF({ ...f, payPreview: e.target.value.replace(/\D/g, '') })} /></label>
      {hr && <label><span>Центр</span><select value={f.centerId} onChange={(e) => setF({ ...f, centerId: e.target.value })}><option value="kz-almaty-sc">СЦ Алматы</option><option value="kg-bishkek-wh">Склад Бишкек</option></select></label>}
      <div className="ext-actions" style={{ alignSelf: 'end' }}><Button type="submit">{t('sh.publish')}</Button></div>
    </form>
    {msg && <p className={msg.ok ? 'ext-muted' : 'field-error'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
  </section>
}

function Team() {
  const t = useT()
  const q = useApi<{ items: TeamShift[] }>('/ext/shifts/team')
  return <section className="ext-section"><span className="eyebrow">04</span><h2>{t('sh.team')}</h2>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.items.length}>
      <div className="ext-table-scroll" role="region" tabIndex={0} aria-label={t('sh.team')}><table className="ext-table" data-testid="shifts-team"><tbody>{q.data?.items.map((s) => <tr key={s.id}>
        <td><strong>{when(s)}</strong><br /><span className="ext-muted">{s.centerName}</span></td><td>{s.assigneeName ?? <Pill tone="warning">{t('sh.free')}</Pill>}</td>
        <td className="ext-muted">{s.history.map((h, i) => <span key={i}>{h.actorName ?? '—'} {t(`sh.event.${h.event}`)}<br /></span>)}</td></tr>)}</tbody></table></div>
    </ExtState></section>
}
