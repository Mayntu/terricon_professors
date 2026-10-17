import { useSyncExternalStore } from 'react'

const query = matchMedia('(prefers-reduced-motion: reduce)')
const subscribe = (notify: () => void) => { query.addEventListener('change', notify); return () => query.removeEventListener('change', notify) }
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => query.matches, () => true)
