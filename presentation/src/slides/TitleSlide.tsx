import { SlideChrome } from '../scenes/SlideChrome'

export function TitleSlide() {
  return <>
    <SlideChrome chapter="01" label="НАЧАЛО МАРШРУТА" />
    <div className="title-caption reveal"><span className="signal-dot" /> HUMAN-CENTERED OPERATIONS</div>
    <div className="title-body">
      <div className="title-overline mono reveal">ОДИН ЧЕЛОВЕК. ЕДИНЫЙ ПУТЬ.</div>
      <div className="type-mask"><h1 className="title-word type-reveal">Jana<span>Мен</span><sup>↗</sup></h1></div>
      <div className="type-mask"><p className="title-tagline type-reveal">От запроса — к результату<span>.</span></p></div>
      <p className="title-description reveal">Единая цифровая HR-платформа</p>
    </div>
    <div className="orbital-map" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-cross" /><span className="orbit-coordinate mono">43°14′ N / 76°56′ E</span><span className="orbit-label mono">FLOW / 001</span><div className="orbit-core">J<span>↗</span></div><span className="orbit-point p1" /><span className="orbit-point p2" /></div>
    <div className="authors reveal"><span className="mono authors-label">СОЗДАТЕЛИ ПРОЕКТА</span><span>Бондарев Владислав</span><span>Хуснуллил Даниил</span></div>
    <div className="title-side-note mono reveal">REQUEST<br /><span>↓</span><br />RESULT</div>
  </>
}
