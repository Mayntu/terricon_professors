import { useLayoutEffect, useRef, useState } from 'react'
import { SIZE } from '../animations/tokens'

export function useStageSize() {
  const viewport = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useLayoutEffect(() => {
    const el = viewport.current!
    const fit = () => setScale(Math.min(el.clientWidth / SIZE.width, el.clientHeight / SIZE.height))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { viewport, scale }
}
