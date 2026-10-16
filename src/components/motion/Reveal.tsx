import type { PropsWithChildren } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { motionTokens } from '@/styles/motion'

/** One quiet entry, no scroll listener, loop or delayed access to controls. */
export function Reveal({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : motionTokens.transition}
    >
      {children}
    </motion.div>
  )
}
