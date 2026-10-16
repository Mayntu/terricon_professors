import { createContext, useContext, useSyncExternalStore } from 'react'
import type { ApplicationServices } from './contracts'

export const ServicesContext = createContext<ApplicationServices | null>(null)
export function useServices() {
  const services = useContext(ServicesContext)
  if (!services) throw new Error('ServicesContext is required')
  return services
}
export function useServiceRevision() {
  const services = useServices()
  return useSyncExternalStore(services.subscribe, services.getRevision)
}
