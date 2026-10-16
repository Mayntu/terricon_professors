import type { PropsWithChildren } from 'react'
import { MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import { motionTokens } from '@/styles/motion'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user" transition={motionTokens.transition}>
        {children}
      </MotionConfig>
    </BrowserRouter>
  )
}
