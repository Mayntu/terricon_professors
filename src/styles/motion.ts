/** Seconds for Motion/GSAP; keep CSS millisecond tokens in tokens.css aligned. */
export const motionTokens = {
  duration: { instant: 0, fast: 0.16, standard: 0.24, deliberate: 0.4 },
  ease: [0.22, 1, 0.36, 1] as const,
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
} as const
