import { useEffect, useState } from 'react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { SegmentedControl } from '@/components/motion/SegmentedControl'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { ExtState, LangSwitch } from '../ext-core/ui'
import { PeopleTable } from './PeopleTable'
import type { Profile } from './types'
import './i18n'

type Country = 'all' | 'KZ' | 'KG'

/** HR: все сотрудники (GET /api/employees) с фильтром по стране и поиском. */
export default function HrEmployeesPage() {
  const t = useT()
  const [country, setCountry] = useState<Country>('all')
  const [search, setSearch] = useState('')
  const q = useApi<{ items: Profile[] }>(country === 'all' ? '/employees' : `/employees?country=${country}`)
  useEffect(() => { document.title = `${t('pp.emp.title')} · JanaМен` }, [t])
  const items = q.data?.items.filter((p) => p.displayName.toLowerCase().includes(search.trim().toLowerCase())) ?? []
  return <div className="business-page">
    <WorkspaceHeading index={t('pp.emp.index')} title={t('pp.emp.title')}>{t('pp.emp.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><div className="ext-row">
      <div className="ext-tabs ext-tabs--small"><SegmentedControl<Country> label={t('pp.req.country')} value={country} onChange={setCountry} options={[{ value: 'all', label: t('pp.all') }, { value: 'KZ', label: 'KZ' }, { value: 'KG', label: 'KG' }]} /></div>
      <label className="ext-form" style={{ margin: 0 }}><span className="sr-only">{t('pp.search')}</span><input type="search" placeholder={t('pp.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
    </div><LangSwitch /></div>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !items.length} emptyTitle={t('pp.empty')}>
      <PeopleTable items={items} salary />
    </ExtState>
  </div>
}
