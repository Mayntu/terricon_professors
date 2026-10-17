import { useT } from '@/modules/ext-core/i18n'
import type { ServiceProblem } from '@/services/contracts'
import { Button } from './Button'

export function QueryState({ problem, retry }: { problem: ServiceProblem | null; retry: () => void }) {
  const t = useT()
  if (problem) return <div className="service-error" role="alert"><p>{problem.message}</p><Button variant="secondary" onClick={retry}>{t('common.retry')}</Button></div>
  return <p className="query-loading" role="status">{t('common.loading')}</p>
}
