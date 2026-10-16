import { useEffect, useState } from 'react'
import type { RequestOptions, ServiceProblem, ServiceResult } from './contracts'
import { useServiceRevision } from './context'
import { useDemoSession } from '@/features/identity/demo-context'

/** load must be stable (service method or useCallback). Ignores stale/aborted results. */
export function useServiceQuery<T>(load: (options?: RequestOptions) => Promise<ServiceResult<T>>) {
  const revision = useServiceRevision()
  const { user } = useDemoSession()
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState<{ owner: string | undefined; load: typeof load; revision: number; retry: number; data: T | null; problem: ServiceProblem | null } | null>(null)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    void load({ signal: controller.signal }).then((result) => {
      if (active) setState({ owner: user?.id, load, revision, retry, data: result.ok ? result.data : null, problem: result.ok ? null : result.problem })
    }).catch(() => {
      if (active) setState({ owner: user?.id, load, revision, retry, data: null, problem: { kind: 'unavailable', message: 'Не удалось загрузить данные. Попробуйте ещё раз.' } })
    })
    return () => { active = false; controller.abort() }
  }, [load, user?.id, revision, retry])
  const sameQuery = state?.owner === user?.id && state?.load === load
  const settled = sameQuery && state?.revision === revision && state.retry === retry
  return { data: sameQuery ? state?.data ?? null : null, problem: settled ? state.problem : null, loading: !settled, refresh: () => setRetry((value) => value + 1) }
}
