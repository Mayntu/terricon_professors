import type { PropsWithChildren } from 'react'
import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import { motionTokens } from '@/styles/motion'
import { browserDemoSessionStore } from '@/mocks/demo-session'
import { DemoSessionProvider } from './DemoSessionProvider'
import { createMockServices } from '@/mocks/services'
import { ServicesContext } from '@/services/context'

const services = createMockServices(browserDemoSessionStore)

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user" transition={motionTokens.transition}>
        <ServicesContext value={services}><DemoSessionProvider auth={services.auth}>{children}</DemoSessionProvider></ServicesContext>
      </MotionConfig>
    </BrowserRouter>
  )
}
