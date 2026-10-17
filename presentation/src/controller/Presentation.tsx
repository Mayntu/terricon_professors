import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { enterScene, exitScene } from '../animations/scenes'
import { chapters, SIZE } from '../animations/tokens'
import { screens, screenUrl, type Screen } from '../assets/screens'
import { RouteCanvas } from '../scenes/RouteCanvas'
import { TitleSlide } from '../slides/TitleSlide'
import { ProblemSlide } from '../slides/ProblemSlide'
import { SolutionSlide } from '../slides/SolutionSlide'
import { useStageSize } from './useStageSize'
import { useReducedMotion } from './useReducedMotion'
import { ScreenInspector } from './ScreenInspector'
import { CinematicOutro } from '../scenes/outro/CinematicOutro'

const initialSlide = () => Math.max(0, Math.min(2, Number(location.hash.match(/^#slide-([123])$/)?.[1] ?? 1) - 1))

export function Presentation() {
  const [index, setIndex] = useState(initialSlide)
  const [replay, setReplay] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [screen, setScreen] = useState<Screen | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [outro, setOutro] = useState(location.hash === '#outro')
  const stage = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const ctx = useRef<gsap.Context | null>(null)
  const enter = useRef<gsap.core.Timeline | null>(null)
  const lock = useRef(false)
  const entryDirection = useRef(0)
  const returnFocus = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotion()
  const { viewport, scale } = useStageSize()

  useEffect(() => { screens.forEach(s => { const img = new Image(); img.src = screenUrl(s) }) }, [])
  useLayoutEffect(() => {
    lock.current = false
    ctx.current = gsap.context(() => { enter.current = enterScene(stage.current!, index, reduced, entryDirection.current) }, stage)
    if (location.hash === '#outro') enter.current?.progress(1).pause()
    entryDirection.current = 0
    if (location.hash !== '#outro') history.replaceState(null, '', `#slide-${index + 1}`)
    return () => { ctx.current?.revert(); ctx.current = null; enter.current = null }
  }, [index, replay, reduced])

  const launchOutro = useCallback(() => { enter.current?.progress(1).pause(); setOutro(true); history.replaceState(null, '', '#outro') }, [])
  const returnToDeck = useCallback(() => { setOutro(false); setIndex(2); setReplay(value => value + 1); history.replaceState(null, '', '#slide-3'); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('button[aria-label="Смотреть финальный ролик"]')?.focus()) }, [])
  const go = useCallback((target: number) => {
    if (target === 3 && !lock.current && !screen) { launchOutro(); return }
    if (target < 0 || target > 2 || target === index || lock.current || screen) return
    lock.current = true
    setBusy(true)
    enter.current?.progress(1).pause()
    entryDirection.current = Math.sign(target - index)
    if (reduced) { setBusy(false); setIndex(target); return }
    ctx.current?.add(() => { exitScene(stage.current!, index, Math.sign(target - index), () => { setBusy(false); setIndex(target) }) })
  }, [index, launchOutro, reduced, screen])
  const restart = useCallback(() => {
    if (screen) return
    ctx.current?.revert()
    lock.current = false
    setBusy(false)
    setReplay(value => value + 1)
  }, [screen])
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const resetLock = () => { lock.current = false; setBusy(false) }
    query.addEventListener('change', resetLock)
    return () => query.removeEventListener('change', resetLock)
  }, [])
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await root.current?.requestFullscreen()
    } catch { setNotice('Полноэкранный режим недоступен. Используйте F11 в браузере.') }
  }, [])
  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timeout)
  }, [notice])
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (outro || screen || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      const target = event.target as HTMLElement
      if (target.matches('input, textarea, select, [contenteditable="true"]')) return
      if (event.code === 'ArrowRight' || (event.code === 'Space' && !target.closest('button, a'))) { event.preventDefault(); go(index + 1) }
      if (event.code === 'ArrowLeft') { event.preventDefault(); go(index - 1) }
      if (event.code === 'KeyR') { event.preventDefault(); restart() }
      if (event.code === 'KeyF') { event.preventDefault(); void toggleFullscreen() }
      if (event.code === 'Escape' && document.fullscreenElement) void document.exitFullscreen()
    }
    document.addEventListener('keydown', keyboard)
    return () => document.removeEventListener('keydown', keyboard)
  }, [go, index, outro, restart, screen, toggleFullscreen])
  const inspect = (next: Screen) => { returnFocus.current = document.activeElement as HTMLElement; enter.current?.progress(1).pause(); setScreen(next) }
  const closeInspector = () => { setScreen(null); requestAnimationFrame(() => returnFocus.current?.focus()) }

  return <div ref={root} className="presentation" data-active-slide={index + 1} data-reduced-motion={reduced} data-busy={busy}>
    <div className="sr-only" aria-live="polite" aria-atomic="true">Слайд {index + 1} из 3. {chapters[index]}</div>
    <main ref={viewport} className="viewport" aria-label="JANA / THE FLOW — презентация" aria-hidden={outro} inert={outro}>
      <div className="stage-container" style={{ width: SIZE.width * scale, height: SIZE.height * scale }}>
        <div ref={stage} className="stage" style={{ transform: `scale(${scale})` }}>
          <RouteCanvas />
          {[<TitleSlide key="title" />, <ProblemSlide key="problem" />, <SolutionSlide key="solution" onInspect={inspect} />].map((slide, i) => <section key={i} className="slide" data-slide={i} aria-hidden={i !== index} inert={i !== index} aria-label={`Слайд ${i + 1}: ${chapters[i]}`}><div className="slide-inner">{slide}</div></section>)}
          <div className="transition-curtain" aria-hidden="true" />
        </div>
      </div>
    </main>
    <nav className="controls" aria-label="Управление презентацией" aria-hidden={outro} inert={outro}>
      <div className="transport"><button onClick={() => go(index - 1)} disabled={index === 0 || busy} aria-label="Предыдущий слайд">←</button><div className="chapter-buttons">{chapters.map((chapter, i) => <button key={chapter} onClick={() => go(i)} aria-label={`Слайд ${i + 1}: ${chapter}`} aria-current={i === index ? 'step' : undefined} disabled={busy}>{String(i + 1).padStart(2, '0')}</button>)}</div><button onClick={() => go(index + 1)} disabled={busy} aria-label={index === 2 ? 'Смотреть финальный ролик' : 'Следующий слайд'} title={index === 2 ? 'Финальный ролик · 30 секунд' : undefined}>{index === 2 ? '▷' : '→'}</button><span className="scene-label">{index === 2 ? 'ФИНАЛ / 30 СЕК' : 'JANA / THE FLOW'}</span></div>
      {index === 2 ? <div className="screen-gallery" aria-label="Открыть реальные экраны">{screens.map((s, i) => <button key={s.id} onClick={() => inspect(s)} aria-label={`Скриншот: ${s.title}`} title={s.title}>{i + 1}</button>)}</div> : <div className="controls-hint"><span><kbd>← → / SPACE</kbd> слайды</span><span><kbd>R</kbd> повтор</span><span><kbd>F</kbd> полный экран</span></div>}
      <div className="control-tools"><button onClick={restart} aria-label="Повторить анимацию" title="Повторить · R">↻</button><button onClick={() => void toggleFullscreen()} aria-label={fullscreen ? 'Выйти из полного экрана' : 'Полный экран'} title="Полный экран · F">⛶</button></div>
    </nav>
    {notice && <p className="notice" role="status">{notice}</p>}
    {screen && <ScreenInspector screen={screen} onClose={closeInspector} />}
    {outro && <CinematicOutro onBack={returnToDeck} onFullscreen={() => void toggleFullscreen()} />}
  </div>
}
