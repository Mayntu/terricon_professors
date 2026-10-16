import type { ServiceProblem } from '@/services/contracts'
import { Button } from './Button'

export function QueryState({ problem, retry }: { problem: ServiceProblem | null; retry: () => void }) {
  if (problem) return <div className="service-error" role="alert"><p>{problem.message}</p><Button variant="secondary" onClick={retry}>Попробовать ещё раз</Button></div>
  return <p className="query-loading" role="status">Загружаем демо-данные…</p>
}
