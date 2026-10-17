import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { FILM } from './config'
import { logoPaths } from './paths'

gsap.registerPlugin(MotionPathPlugin)

/** One seekable 30 s timeline for the HTML player and every exported video frame.
 * No timers, random values, async callbacks, network or CSS animation drive visuals. */
export function createFilmTimeline(root: HTMLElement, onTime?: (time: number) => void) {
  const q = gsap.utils.selector(root)
  const path = root.querySelector<SVGPathElement>('.film-flow-active')!
  const shimmer = root.querySelector<SVGPathElement>('.film-logo-shimmer')!
  const length = path.getTotalLength()
  const hidden = '.film-request-world,.film-flow-world,.film-connected-world,.film-brand-network,.film-end-card,.film-request-copy,.film-flow-copy,.film-connected-copy,.film-capture-note'
  gsap.set(q(hidden), { autoAlpha: 0 })
  gsap.set(q('.film-form-filled,.film-submit-dialog,.film-data-signal,.film-cursor,.film-click-ring,.film-flow-pulse,.film-manager-screen,.film-manager-cursor,.film-manager-ring,.film-approved-stamp,.film-source-card,.film-logo-nodes,.film-logo-pulse'), { autoAlpha: 0 })
  gsap.set(q('.film-portal'), { autoAlpha: 0 })
  gsap.set(q('.result-check'), { autoAlpha: 0 })
  gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, stroke: '#e4e2d8' })
  gsap.set(shimmer, { strokeDasharray: '70 2000', strokeDashoffset: 90, opacity: 0 })
  gsap.set(q('.film-end-card'), { y: 35 })
  const clock = { time: 0 }
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' }, onUpdate: () => onTime?.(tl.time()) })
  tl.to(clock, { time: FILM.duration, duration: FILM.duration, ease: 'none' }, 0)
  tl.addLabel('road', 0).addLabel('request', 5).addLabel('decision', 10).addLabel('connected', 15).addLabel('brand', 20).addLabel('final', 25)

  // 00–05: moving camera, solid metal geometry, low light, no transport brand.
  tl.from(q('.film-opening-copy h2'), { opacity: 0.3, y: 30, duration: 1.3, ease: 'power3.out' }, 0)
    .from(q('.film-opening-copy>.mono'), { opacity: 0.3, duration: 1 }, 0)
    .fromTo(q('.film-truck-track'), { x: -330, y: 100, scale: 0.8, opacity: 0 }, { x: 70, y: 0, scale: 1.06, opacity: 1, duration: 3.9, ease: 'power2.out' }, 0.25)
    .to(q('.film-road-grid'), { x: -250, y: 90, scale: 1.08, transformOrigin: '60% 60%', duration: 5.4, ease: 'none' }, 0)
    .to(q('.road-stripes'), { strokeDashoffset: -900, duration: 5.5, ease: 'power1.in' }, 0)
    .to(q('.road-trail'), { strokeDashoffset: 0, duration: 4.6, ease: 'power1.in' }, 0.4)
    .to(q('.film-portal'), { autoAlpha: 1, duration: 0.7 }, 3.5)
    .to(q('.film-truck-track'), { x: 720, y: -100, scale: 0.38, opacity: 0, duration: 1.3, ease: 'power2.in' }, 4.25)
    .to(q('.film-opening-copy,.road-coordinates'), { opacity: 0, y: -40, duration: 0.6 }, 4.45)
    .to(q('.film-portal'), { left: 730, top: 140, width: 1080, height: 840, rotationY: 0, rotationZ: 0, duration: 1.1, ease: 'power3.inOut' }, 4.8)
    .to(q('.film-road-world'), { autoAlpha: 0, duration: 0.55 }, 5.5)
  q('.wheel-spoke').forEach(spoke => tl.to(spoke, { attr: { transform: `rotate(840 ${spoke.getAttribute('data-x')} 294)` }, duration: 5.5, ease: 'power1.in' }, 0))

  // 05–10: actual empty/filled form and submit confirmation from the same record.
  tl.to(q('.film-request-world'), { autoAlpha: 1, duration: 0.5 }, 5.3)
    .fromTo(q('.film-request-panel'), { rotationY: -14, scale: 0.96 }, { rotationY: 0, scale: 1, duration: 1.2, immediateRender: false }, 5.25)
    .to(q('.film-request-copy,.film-capture-note'), { autoAlpha: 1, duration: 0.6 }, 5.4)
    .set(q('.film-cursor'), { autoAlpha: 1, x: 1050, y: 840 }, 6)
    .to(q('.film-cursor'), { x: 970, y: 580, duration: 0.55 }, 6)
    .set(q('.film-click-ring'), { autoAlpha: 1, x: 940, y: 550, scale: 0.2 }, 6.55)
    .to(q('.film-click-ring'), { scale: 1.3, autoAlpha: 0, duration: 0.4 }, 6.55)
    .to(q('.film-cursor'), { x: 1220, y: 580, duration: 0.4 }, 6.65)
    .to(q('.film-form-filled'), { autoAlpha: 1, duration: 0.3 }, 7.05)
    .to(q('.film-cursor'), { x: 920, y: 880, duration: 0.5 }, 7.2)
    .fromTo(q('.film-submit-dialog'), { autoAlpha: 0, y: 35, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, immediateRender: false }, 7.8)
    .to(q('.film-cursor'), { x: 1275, y: 740, duration: 0.45 }, 8.05)
    .set(q('.film-click-ring'), { autoAlpha: 1, x: 1245, y: 710, scale: 0.2 }, 8.5)
    .to(q('.film-click-ring'), { scale: 1.5, autoAlpha: 0, duration: 0.35 }, 8.5)
    .to(q('.film-submit-dialog'), { scale: 0.1, x: -125, y: 230, autoAlpha: 0, duration: 0.65 }, 8.85)
    .to(q('.film-request-panel'), { scale: 0.08, x: -310, y: 200, autoAlpha: 0, duration: 0.8 }, 8.85)
    .to(q('.film-cursor,.film-request-copy,.film-request-label'), { autoAlpha: 0, duration: 0.3 }, 8.8)
    .fromTo(q('.film-data-signal'), { autoAlpha: 0, scale: 3 }, { autoAlpha: 1, scale: 1, duration: 0.45, immediateRender: false }, 9.1)
    .to(q('.film-data-signal'), { x: -700, y: 110, scale: 0.7, duration: 0.9 }, 9.45)
    .to(q('.film-request-world'), { autoAlpha: 0, duration: 0.3 }, 10.2)

  // 10–15: Employee → Manager → Result. HR is not a mandatory approval node.
  tl.to(q('.film-flow-world'), { autoAlpha: 1, duration: 0.6 }, 9.65)
    .fromTo(q('.film-flow-original'), { autoAlpha: 0, scale: 0.82, y: 100 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, immediateRender: false }, 9.7)
    .to(q('.film-flow-original'), { scale: 0.7, y: 150, autoAlpha: 0, duration: 0.6 }, 10.65)
    .fromTo(q('.film-flow-node'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, immediateRender: false }, 10.65)
    .to(q('.film-flow-copy'), { autoAlpha: 1, duration: 0.7 }, 10.65)
    .to(path, { strokeDashoffset: length * 0.45, duration: 1.2, ease: 'none' }, 10.5)
    .set(q('.film-flow-pulse'), { autoAlpha: 1 }, 10.5)
    .to(q('.film-flow-pulse'), { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0.55 }, duration: 1.2, ease: 'none' }, 10.5)
    .fromTo(q('.film-manager-screen'), { autoAlpha: 0, y: 50, scale: 0.85 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, immediateRender: false }, 11.45)
    .set(q('.film-manager-cursor'), { autoAlpha: 1, x: 1450, y: 720 }, 12.15)
    .to(q('.film-manager-cursor'), { x: 1210, y: 575, duration: 0.5 }, 12.15)
    .set(q('.film-manager-ring'), { autoAlpha: 1, x: 1180, y: 545, scale: 0.2 }, 12.65)
    .to(q('.film-manager-ring'), { scale: 1.5, autoAlpha: 0, duration: 0.4 }, 12.65)
    .to(q('.film-manager-screen'), { autoAlpha: 0, scale: 0.2, y: 100, duration: 0.6 }, 13.15)
    .to(q('.film-manager-cursor'), { autoAlpha: 0, duration: 0.2 }, 13.1)
    .to(q('.film-manager>i,.film-employee>i'), { backgroundColor: '#8FCFA9', color: '#101B18', duration: 0.4 }, 13.2)
    .to(path, { stroke: '#8FCFA9', duration: 0.4 }, 13.2)
    .to(path, { strokeDashoffset: 0, duration: 0.8, ease: 'none' }, 13.35)
    .to(q('.film-flow-pulse'), { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0.55, end: 1 }, duration: 0.8, ease: 'none' }, 13.35)
    .to(q('.film-result>i'), { backgroundColor: '#8FCFA9', color: '#101B18', duration: 0.3 }, 14.05)
    .to(q('.result-wait'), { autoAlpha: 0, duration: 0.2 }, 14.05)
    .to(q('.result-check'), { autoAlpha: 1, duration: 0.2 }, 14.05)
    .to(q('.film-approved-stamp'), { autoAlpha: 1, duration: 0.45 }, 13.8)
    .to(q('.film-flow-pulse'), { autoAlpha: 0, duration: 0.2 }, 14.15)
    .to(q('.film-flow-world'), { scale: 0.45, x: -550, y: 150, autoAlpha: 0, transformOrigin: '50% 50%', duration: 1.2 }, 14.6)
    .to(q('.film-flow-copy'), { autoAlpha: 0, y: -40, duration: 0.5 }, 14.6)

  // 15–20: one network, actual completed course, actual source opened.
  tl.to(q('.film-connected-world,.film-connected-copy'), { autoAlpha: 1, duration: 0.7 }, 15)
    .fromTo(q('.film-connected-card'), { y: 80, rotationY: -9, autoAlpha: 0 }, { y: 0, rotationY: 0, autoAlpha: 1, duration: 0.9, stagger: 0.15, immediateRender: false }, 15)
    .fromTo(q('.film-connected-lines'), { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, immediateRender: false }, 15.1)
    .fromTo(q('.film-course-result'), { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, immediateRender: false }, 16.4)
    .to(q('.film-academy-card'), { y: -20, duration: 0.6 }, 16.3)
    .fromTo(q('.film-source-card'), { autoAlpha: 0, y: 80, rotationY: -12 }, { autoAlpha: 1, y: 0, rotationY: 0, duration: 0.8, immediateRender: false }, 18)
    .to(q('.film-connected-world'), { scale: 0.8, y: 40, transformOrigin: '50% 60%', duration: 1.2 }, 19.5)
    .to(q('.film-connected-copy'), { autoAlpha: 0, y: -40, duration: 0.6 }, 19.7)
    .to(q('.film-connected-card,.film-source-card'), { scale: 0.06, autoAlpha: 0, duration: 1.1, stagger: 0.05 }, 20)
    .to(q('.film-connected-world'), { autoAlpha: 0, duration: 0.6 }, 20.8)

  // 20–25: paths converge into the existing JanaМен mark (not a new logo).
  tl.to(q('.film-brand-network'), { autoAlpha: 1, duration: 0.8 }, 20)
  logoPaths.forEach((d, i) => {
    tl.to(q(`.gather-${i}`), { attr: { d }, stroke: '#8FCFA9', strokeWidth: i < 2 ? 10 : 2, opacity: i < 2 ? 1 : 0, duration: 3.3, ease: 'power3.inOut' }, 20.55 + i * 0.09)
  })
  tl.fromTo(q('.film-logo-nodes'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.65, immediateRender: false }, 23.5)
    .to(q('.film-brand-network'), { x: -545, y: -15, scale: 0.42, duration: 1.3, ease: 'power3.inOut' }, 24.2)
    .to(q('.film-capture-note'), { autoAlpha: 0, duration: 0.4 }, 24)

  // 25–30: no CTA, one pulse, still ending with both exact author names.
  tl.to(q('.film-end-card'), { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 25)
    .fromTo(q('.film-end-card h1'), { yPercent: 105 }, { yPercent: 0, duration: 1.2, ease: 'power3.out', immediateRender: false }, 25)
    .fromTo(q('.film-end-authors'), { y: 15, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, immediateRender: false }, 25.8)
    .set(shimmer, { opacity: 1 }, 26.2)
    .to(shimmer, { strokeDashoffset: -1500, duration: 1.1, ease: 'power2.inOut' }, 26.2)
    .set(q('.film-logo-pulse'), { autoAlpha: 1 }, 26.2)
    .to(q('.film-logo-pulse'), { motionPath: { path: shimmer, align: shimmer, alignOrigin: [0.5, 0.5] }, duration: 1.1, ease: 'power2.inOut' }, 26.2)
    .to(q('.film-logo-pulse'), { autoAlpha: 0, duration: 0.25 }, 27.3)
    .set(shimmer, { opacity: 0 }, 27.55)
  return tl
}
