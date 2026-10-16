import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

// Import only where a scoped timeline is needed; not in the root bundle.
// useGSAP({ scope }) owns cleanup; use gsap.matchMedia for reduced motion.
export { gsap, useGSAP }
