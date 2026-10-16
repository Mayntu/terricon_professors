import type { ServiceResult } from '../services/contracts'
import { createSeed, type MockState } from './seed'
import { isMockState } from './state-validation'

export const mockStorageKey = 'jana.mock-state.v1'
export type Persistence = Pick<Storage, 'getItem' | 'setItem'>

export class MockStore {
  private revision = 0
  private listeners = new Set<() => void>()
  private readonly persistence: Persistence

  constructor(persistence?: Persistence) {
    // Defer browser storage access so blocked storage becomes a visible service error.
    this.persistence = persistence ?? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    }
  }

  getRevision = () => this.revision
  private changed = () => { this.revision += 1; this.listeners.forEach((listener) => listener()) }
  private onStorage = (event: StorageEvent) => { if (event.key === mockStorageKey || event.key === null) this.changed() }

  subscribe = (listener: () => void) => {
    if (this.listeners.size === 0 && typeof window !== 'undefined') window.addEventListener('storage', this.onStorage)
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', this.onStorage)
    }
  }

  read(): MockState {
    const stored = this.persistence.getItem(mockStorageKey)
    if (stored === null) return createSeed()
    const parsed: unknown = JSON.parse(stored)
    if (!isMockState(parsed)) throw new Error('Unsupported mock storage')
    return parsed
  }

  async transact<T>(change: (state: MockState) => ServiceResult<T>): Promise<ServiceResult<T>> {
    const commit = (): ServiceResult<T> => {
      try {
        const state = this.read()
        const result = change(state)
        if (!result.ok) return result
        // One write commits the request, event and notification together. No timer.
        this.persistence.setItem(mockStorageKey, JSON.stringify(state))
        this.changed()
        return result
      } catch {
        return { ok: false, problem: { kind: 'unavailable', message: 'Не удалось сохранить демо-данные. Проверьте доступ к localStorage. Существующие данные не изменены.' } }
      }
    }
    // Avoid lost updates when Employee and Manager use separate same-origin tabs.
    if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(mockStorageKey, commit)
    return commit()
  }
}
