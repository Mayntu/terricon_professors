export const FILM = { width: 1920, height: 1080, duration: 30, fps: 30, frames: 900 } as const
export const filmChapters = [
  { at: 0, title: 'У каждого запроса есть путь' },
  { at: 5, title: 'Запрос становится сигналом' },
  { at: 10, title: 'Каждый этап прозрачен' },
  { at: 15, title: 'Всё связано' },
  { at: 20, title: 'Единый маршрут JanaМен' },
  { at: 25, title: 'От запроса — к результату' },
] as const
export const filmAsset = (name: string) => `${import.meta.env.BASE_URL}assets/outro/${name}.png`
export const filmImages = ['leave-empty', 'leave-filled', 'leave-confirm', 'flow-submitted', 'manager-confirm', 'flow-approved', 'academy-completed', 'ai-answer', 'ai-source']

export interface FilmControl {
  duration: number
  seek: (time: number) => void
  play: () => void
  pause: () => void
  time: () => number
}
declare global { interface Window { __JANA_OUTRO__?: FilmControl } }
