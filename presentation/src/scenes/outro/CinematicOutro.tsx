import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { FilmCanvas } from './FilmCanvas'
import { FILM, filmAsset, filmChapters, filmImages } from './config'
import { createFilmTimeline } from './timeline'
import { useStageSize } from '../../controller/useStageSize'
import { useReducedMotion } from '../../controller/useReducedMotion'
import './outro.css'

const Artwork = memo(FilmCanvas)

export function CinematicOutro({ renderMode = false, onBack, onFullscreen }: { renderMode?: boolean; onBack?: () => void; onFullscreen?: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const reduced = useReducedMotion()
  const { viewport, scale } = useStageSize()
  useEffect(() => {
    let active = true
    Promise.all([document.fonts.ready, ...filmImages.map(name => new Promise<void>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(); img.onerror = () => reject(new Error(name)); img.src = filmAsset(name) }))])
      .then(() => { if (active) setReady(true) })
      .catch(() => { if (active) setError('Не удалось загрузить кадры. Обновите страницу или вернитесь к слайдам.') })
    return () => { active = false }
  }, [])
  useLayoutEffect(() => {
    if (!ready) return
    const canvas = root.current!
    const context = gsap.context(() => {
      const tl = createFilmTimeline(canvas, seconds => {
        canvas.dataset.time = seconds.toFixed(3)
        if (!renderMode) { setTime(Math.floor(seconds * 10) / 10); if (seconds >= FILM.duration) setPlaying(false) }
      })
      timeline.current = tl
      window.__JANA_OUTRO__ = { duration: FILM.duration, seek: seconds => { tl.pause().seek(Math.max(0, Math.min(FILM.duration, seconds)), false); canvas.dataset.time = tl.time().toFixed(3); if (!renderMode) setPlaying(false) }, play: () => tl.play(), pause: () => tl.pause(), time: () => tl.time() }
      if (renderMode) tl.pause(0)
      else if (reduced) tl.seek(FILM.duration, false).pause()
      else tl.play(0)
    }, canvas)
    if (!renderMode) canvas.closest<HTMLElement>('.cinema')?.focus({ preventScroll: true })
    // Playback state follows the actual initialized timeline; visuals remain GSAP-owned.
    queueMicrotask(() => { if (timeline.current) setPlaying(!renderMode && !reduced) })
    return () => { context.revert(); timeline.current = null; delete window.__JANA_OUTRO__ }
  }, [ready, reduced, renderMode])
  const toggle = useCallback(() => {
    const tl = timeline.current
    if (!tl || reduced) return
    if (tl.isActive()) { tl.pause(); setPlaying(false) }
    else { if (tl.time() >= FILM.duration) tl.seek(0); tl.play(); setPlaying(true) }
  }, [reduced])
  const restart = useCallback(() => {
    if (reduced) { timeline.current?.seek(FILM.duration, false).pause(); return }
    timeline.current?.restart(); setPlaying(true)
  }, [reduced])
  useEffect(() => {
    if (renderMode) return
    const keyboard = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || (event.target as HTMLElement).matches('input')) return
      if (event.code === 'Space' && !(event.target as HTMLElement).closest('button, a')) { event.preventDefault(); toggle() }
      if (event.code === 'KeyR') { event.preventDefault(); restart() }
      if (event.code === 'KeyF') { event.preventDefault(); onFullscreen?.() }
      if (event.code === 'ArrowLeft') { event.preventDefault(); onBack?.() }
      if (event.code === 'Escape') { if (document.fullscreenElement) void document.exitFullscreen(); else onBack?.() }
    }
    document.addEventListener('keydown', keyboard)
    return () => document.removeEventListener('keydown', keyboard)
  }, [onBack, onFullscreen, renderMode, restart, toggle])
  const chapter = filmChapters[Math.min(5, Math.floor(time / 5))]!
  return <section tabIndex={-1} className={`cinema ${renderMode ? 'render-mode' : ''}`} aria-label="Финальный ролик JanaМен" data-ready={ready} data-playing={playing}>
    <div className="cinema-viewport" ref={viewport}><div className="film-frame" style={{ width: FILM.width * scale, height: FILM.height * scale }}><div ref={root} className="film-canvas" style={{ transform: `scale(${scale})` }}><Artwork /></div></div></div>
    {!ready && <div className="film-loading" role="status">{error || 'Готовим финальную сцену…'}</div>}
    {!renderMode && <nav className="film-player" aria-label="Управление роликом"><button className="film-back" onClick={onBack}>← К слайдам</button><button className="film-play" onClick={toggle} disabled={!ready || reduced}>{playing ? 'Пауза' : time >= FILM.duration ? 'Повтор' : 'Смотреть'}</button><span className="mono">{String(Math.floor(time)).padStart(2, '0')} / 30</span><input type="range" min="0" max="30" step="0.1" value={time} disabled={!ready} aria-label="Позиция ролика, секунды" onChange={event => window.__JANA_OUTRO__?.seek(Number(event.target.value))} /><span className="mono film-playing-label">{reduced ? 'REDUCED MOTION / ФИНАЛЬНЫЙ КАДР' : chapter.title}</span><button onClick={restart} aria-label="Повторить ролик">↻</button><button onClick={onFullscreen} aria-label="Полный экран ролика">⛶</button></nav>}
    <p className="film-transcript">У каждого запроса есть путь. Сотрудник выбирает даты и отправляет отпуск. Руководитель согласовывает, решение и уведомление сохраняются. Каждый этап прозрачен. HR-заявки, Jana Academy и AI Jana с источником связаны в одном пространстве. JanaМен. От запроса — к результату. Бондарев Владислав. Хуснуллил Даниил.</p>
  </section>
}
