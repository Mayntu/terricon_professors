import { SlideChrome } from '../scenes/SlideChrome'
import { ProductTheatre } from '../scenes/ProductTheatre'
import type { Screen } from '../assets/screens'

export function SolutionSlide({ onInspect }: { onInspect: (screen: Screen) => void }) {
  return <>
    <SlideChrome chapter="03" label="ЗАПРОС СТАНОВИТСЯ РЕЗУЛЬТАТОМ" />
    <div className="solution-copy"><span className="mono eyebrow reveal">РЕШЕНИЕ / JANAМЕН</span><h1><span className="type-mask"><span className="type-reveal">Один вход.</span></span><span className="type-mask"><span className="type-reveal">Один маршрут.</span></span><span className="type-mask"><span className="type-reveal green">Прозрачный</span></span><span className="type-mask"><span className="type-reveal green">результат.</span></span></h1></div>
    <div className="proof-points reveal"><span><b>3</b> роли</span><span>AI <small>с источниками</small></span><span>Обучение <small>с прогрессом</small></span></div>
    <div className="journey" aria-label="Сотрудник отправляет заявку, руководитель принимает решение, сотрудник получает результат"><svg viewBox="0 0 520 150" aria-hidden="true"><path className="journey-track" d="M30 60H115C145 60 145 110 180 110H250C285 110 285 60 320 60H490" /><path className="journey-draw" d="M30 60H115C145 60 145 110 180 110H250C285 110 285 60 320 60H490" /><circle className="journey-pulse" r="5" /></svg><div className="journey-node node-one"><i>01</i><strong>Запрос</strong><small>Сотрудник</small></div><div className="journey-node node-two"><i>02</i><strong>Решение</strong><small>Руководитель / HR</small></div><div className="journey-node node-three"><i>✓</i><strong>Результат</strong><small>История + уведомление</small></div></div>
    <div className="solution-note reveal"><span className="signal-dot" /><p>Ответственность видна.<br />Решение остаётся в истории.</p></div>
    <ProductTheatre onInspect={onInspect} />
  </>
}
