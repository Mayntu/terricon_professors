import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { motion, routes } from './tokens'

gsap.registerPlugin(MotionPathPlugin)

export function enterScene(stage: HTMLElement, index: number, reduced: boolean, direction = 0) {
  const slide = stage.querySelector<HTMLElement>(`[data-slide="${index}"]`)!
  const q = gsap.utils.selector(slide)
  const line = stage.querySelector<SVGPathElement>('.route-main')!
  gsap.set(stage, { backgroundColor: index === 1 ? '#F5F3EE' : '#101B18' })
  gsap.set(stage.querySelectorAll('.slide'), { autoAlpha: 0 })
  gsap.set(slide, { autoAlpha: 1 })
  gsap.set(stage.querySelectorAll('.route-track, .route-main'), { attr: { d: routes[index]! } })
  const length = line.getTotalLength()
  gsap.set(line, { strokeDasharray: length, strokeDashoffset: length, opacity: index === 1 ? 0 : 0.7 })
  gsap.set(stage.querySelector('.route-track'), { opacity: index === 1 ? 0 : 1 })
  gsap.set(stage.querySelector('.route-signal'), { autoAlpha: 0 })
  stage.dataset.phase = 'entering'
  const timeline = gsap.timeline({ id: 'scene-enter', defaults: { ease: motion.entrance }, onComplete: () => { stage.dataset.phase = 'idle' } })
  if (direction && !reduced) timeline.fromTo(stage.querySelector('.transition-curtain'), { xPercent: 0, x: 0 }, { xPercent: direction * 105, duration: 0.45, ease: motion.ease }, 0)
  timeline.from(q('.type-reveal'), { yPercent: 115, duration: motion.reveal, stagger: motion.stagger }, 0.08)
    .from(q('.reveal'), { opacity: 0, y: 18, duration: 0.75, stagger: 0.06 }, 0.3)
    .from(q('.slide-header, .slide-footer'), { opacity: 0, duration: 0.55 }, 0)
  if (index === 0) {
    timeline.from(q('.orbital-map'), { scale: 0.9, x: 80, opacity: 0, duration: 1.6 }, 0)
      .from(stage.querySelector('.route-camera'), { x: -110, y: 30, scale: 1.12, transformOrigin: '70% 50%', duration: 2.4 }, 0)
      .to(line, { strokeDashoffset: 0, duration: 3.2, ease: 'power2.inOut' }, 0.15)
      .set(stage.querySelector('.route-signal'), { autoAlpha: 1 }, 0.15)
      .to(stage.querySelector('.route-signal'), { motionPath: { path: line, align: line, alignOrigin: [0.5, 0.5] }, duration: 3.2, ease: 'power2.inOut' }, 0.15)
      .to(stage.querySelector('.route-signal'), { autoAlpha: 0, duration: 0.3 }, 3.35)
  }
  if (index === 1) {
    timeline.from(q('.island'), { y: 75, x: 35, opacity: 0, rotation: '+=6', duration: 1.1, stagger: 0.12 }, 0.2)
      .from(q('.broken-routes, .disconnect-label'), { opacity: 0, duration: 0.7 }, 1)
  }
  if (index === 2) {
    const frames = q('.product-frame')
    const flow = slide.querySelector<SVGPathElement>('.journey-draw')!
    gsap.set(frames, { autoAlpha: 0 })
    gsap.set(frames[0]!, { autoAlpha: 1 })
    gsap.set(flow, { strokeDasharray: flow.getTotalLength(), strokeDashoffset: flow.getTotalLength() })
    gsap.set(q('.journey-pulse'), { autoAlpha: 0 })
    timeline.to(line, { strokeDashoffset: 0, opacity: 0.25, duration: 1.6 }, 0)
      .from(q('.product-theatre'), { y: 60, rotationY: -7, rotationX: 2, scale: 0.94, opacity: 0, duration: 1.25 }, 0.2)
      .from(q('.journey-node'), { opacity: 0, y: 8, duration: 0.5, stagger: 0.12 }, 0.9)
      .from(q('.support-panel'), { y: 35, opacity: 0, duration: 0.75, stagger: 0.15 }, 11)
      .to(frames[0]!, { scale: 1.13, transformOrigin: '60% 55%', duration: 1.8, ease: 'power2.inOut' }, 2.3)
    // These are archived real screens, not state-changing API calls.
    for (let i = 1; i < 5; i++) {
      const at = [0, 4.2, 6.2, 8.4, 10.5][i]!
      timeline.to(frames[i - 1]!, { autoAlpha: 0, scale: 1, duration: 0.55 }, at)
        .fromTo(frames[i]!, { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7 }, at)
    }
    timeline.to(flow, { strokeDashoffset: 0, duration: 4.2, ease: 'none' }, 6.2)
      .set(q('.journey-pulse'), { autoAlpha: 1 }, 6.2)
      .to(q('.journey-pulse'), { motionPath: { path: flow, align: flow, alignOrigin: [0.5, 0.5] }, duration: 4.2, ease: 'none' }, 6.2)
      .to(q('.node-two i'), { backgroundColor: '#8FCFA9', color: '#101B18', duration: 0.4 }, 8.4)
      .fromTo(q('.node-three'), { opacity: 0.3 }, { opacity: 1, duration: 0.5 }, 10.4)
      .set(q('.journey-pulse'), { autoAlpha: 0 }, 10.5)
  }
  if (reduced) timeline.progress(1).pause()
  return timeline
}

export function exitScene(stage: HTMLElement, index: number, direction: number, done: () => void) {
  stage.dataset.phase = 'exiting'
  const q = gsap.utils.selector(stage.querySelector(`[data-slide="${index}"]`))
  const timeline = gsap.timeline({ id: 'scene-exit', onComplete: done })
  if (index === 1 && direction > 0) {
    timeline.to(q('.island'), { rotation: 0, duration: 0.45, stagger: 0.03, ease: motion.ease }, 0)
      .to(q('.broken-routes, .disconnect-label'), { opacity: 0, duration: 0.3 }, 0)
      .to(stage.querySelector('.route-main'), { opacity: 1, strokeDashoffset: 0, strokeWidth: 5, duration: 0.65, ease: motion.ease }, 0)
  }
  const at = index === 1 && direction > 0 ? 0.4 : 0
  timeline.to(q('.slide-inner'), { x: -direction * 65, scale: 0.97, duration: motion.transition / 2, ease: motion.ease }, at)
    .fromTo(stage.querySelector('.transition-curtain'), { xPercent: -direction * 105, x: 0 }, { xPercent: 0, duration: motion.transition / 2, ease: 'power2.inOut' }, at)
  return timeline
}
