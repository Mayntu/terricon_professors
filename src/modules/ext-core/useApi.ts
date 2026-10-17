import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { api, revisionStore, tokenStore, type ApiProblem } from '@/services/http/client'

/** Загрузка для ext-экранов: перечитывается после любых изменений (ревизия), игнорирует устаревшие ответы. */
export function useApi<T>(path: string | null) {
  const revision = useSyncExternalStore(revisionStore.subscribe, revisionStore.getRevision)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState<{ key: string; data: T | null; problem: ApiProblem | null } | null>(null)
  const identity = `${path}|${tokenStore.read()}`
  const key = `${identity}|${revision}|${retry}`
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    let active = true
    api.get<T>(path, { signal: controller.signal }).then(
      (r) => { if (active) setState({ key, data: r.ok ? r.data : null, problem: r.ok ? null : (r.problem as ApiProblem) }) },
      () => { /* отменено */ },
    )
    return () => { active = false; controller.abort() }
  }, [path, key])
  const settled = state?.key === key
  const data = state?.key.startsWith(`${identity}|`) ? state.data : null
  // Пока идёт перезагрузка — показываем прежние данные (без мигания)
  return { data, problem: settled ? state.problem : null, loading: !settled && !data, refresh: useCallback(() => setRetry((v) => v + 1), []) }
}
