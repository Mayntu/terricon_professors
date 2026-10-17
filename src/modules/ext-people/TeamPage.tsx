import { useEffect } from 'react'
import { WorkspaceHeading } from '@/components/ui/WorkspaceHeading'
import { useApi } from '../ext-core/useApi'
import { useT } from '../ext-core/i18n'
import { ExtState, LangSwitch } from '../ext-core/ui'
import { PeopleTable } from './PeopleTable'
import type { Profile } from './types'
import './i18n'

/** Руководитель: своя команда (GET /api/team), без зарплат — сценарий 3 кейса. */
export default function TeamPage() {
  const t = useT()
  const q = useApi<{ items: Profile[] }>('/team')
  useEffect(() => { document.title = `${t('pp.team.title')} · JanaМен` }, [t])
  return <div className="business-page">
    <WorkspaceHeading index={t('pp.team.index')} title={t('pp.team.title')}>{t('pp.team.lead')}</WorkspaceHeading>
    <div className="ext-row ext-row--between"><span /><LangSwitch /></div>
    <ExtState loading={q.loading} problem={q.problem} retry={q.refresh} empty={!!q.data && !q.data.items.length} emptyTitle={t('pp.empty')}>
      {q.data && <PeopleTable items={q.data.items} salary={false} />}
    </ExtState>
  </div>
}
