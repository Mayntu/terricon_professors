import { RoadScene } from './RoadScene'
import { RequestScene } from './RequestScene'
import { FlowScene } from './FlowScene'
import { ConnectedScene } from './ConnectedScene'
import { BrandResolve } from './BrandResolve'

export function FilmCanvas() {
  return <>
    <div className="film-atmosphere" />
    <div className="film-camera">
      <RoadScene />
      <RequestScene />
      <FlowScene />
      <ConnectedScene />
      <BrandResolve />
    </div>
    <div className="film-opening-copy"><span className="mono">JANAМЕН / ЕДИНАЯ HR-ПЛАТФОРМА</span><h2>У каждого запроса<br />есть <em>путь.</em></h2></div>
    <div className="film-request-copy"><span className="mono">01 / ОТПРАВКА</span><h2>Запрос.<br /><em>В движении.</em></h2></div>
    <div className="film-flow-copy"><span className="mono">02 / СОГЛАСОВАНИЕ</span><h2>Каждый этап<br /><em>прозрачен.</em></h2></div>
    <div className="film-connected-copy"><span className="mono">03 / ЕДИНОЕ ПРОСТРАНСТВО</span><h2>Всё <em>связано.</em></h2></div>
    <div className="film-meta"><span className="mono">FROM REQUEST TO RESULT</span><span className="mono film-capture-note">РЕАЛЬНЫЙ ИНТЕРФЕЙС / ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ</span></div>
    <div className="film-edge-lines" aria-hidden="true" />
  </>
}
