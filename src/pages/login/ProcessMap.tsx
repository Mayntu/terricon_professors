/** Hand-drawn as SVG geometry: no raster assets, random data or animation loops. */
export function ProcessMap() {
  return (
    <figure className="process-panel" data-surface="dark" aria-labelledby="process-caption">
      <div className="process-panel-top"><span className="eyebrow">JANA FLOW / СХЕМА 01</span><span className="map-orientation" aria-hidden="true">N <span>↗</span></span></div>
      <div className="process-heading"><span className="process-overline">Связано с вами</span><h2>Меньше формальностей.<br /><span>Больше движения.</span></h2></div>
      <svg className="process-map" viewBox="0 0 560 510" role="img" aria-labelledby="process-map-title process-map-desc">
        <title id="process-map-title">Маршруты рабочего дня</title>
        <desc id="process-map-desc">Сотрудник в центре системы. Заявка проходит согласование и возвращается результатом. Обучение и поддержка HR соединены в одном пространстве.</desc>
        <defs>
          <pattern id="process-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" className="map-grid-line" /></pattern>
        </defs>
        <rect x="0" y="0" width="560" height="510" fill="url(#process-grid)" />
        <g className="map-coordinates" aria-hidden="true"><text x="8" y="20">A—01</text><text x="492" y="20">X 056</text><text x="8" y="495">Y 048</text><text x="483" y="495">B—04</text></g>
        <g className="map-survey" aria-hidden="true"><path d="M274 35h12m-6-6v12M34 255h12m-6-6v12M514 255h12m-6-6v12M274 475h12m-6-6v12" /></g>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="map-ghost-line" d="M0 160H108Q128 160 128 180V340Q128 360 148 360H420Q440 360 440 380V510" />
          <path className="map-ghost-line" d="M320 0V80Q320 100 340 100H560M0 440H70" />
          <path className="map-track map-track-mint js-route" pathLength="1" d="M64 192H166Q188 192 204 208L248 252Q264 268 286 268H374Q398 268 414 284L480 350" />
          <path className="map-track map-track-orange js-route" pathLength="1" d="M90 426H148Q170 426 186 410L254 342Q270 326 270 304V244Q270 222 286 206L388 104Q404 88 426 88H476" />
          <path className="map-track map-track-paper js-route" pathLength="1" d="M104 68V104Q104 124 120 140L190 210Q206 226 206 248V282Q206 304 222 320L332 430H416" />
        </g>
        <g className="map-station-group">
          <g className="map-station"><circle cx="64" cy="192" r="7" /><text x="64" y="162">Заявка</text><text className="map-mini-label" x="64" y="143">01 / НАЧАЛО</text></g>
          <g className="map-station"><circle cx="374" cy="268" r="7" /><text x="354" y="237">Согласование</text></g>
          <g className="map-station map-station-orange"><circle cx="476" cy="88" r="7" /><text x="376" y="56">Academy</text><text className="map-mini-label" x="376" y="36">02 / РАЗВИТИЕ</text></g>
          <g className="map-station map-station-orange"><circle cx="90" cy="426" r="7" /><text x="64" y="460">Новые навыки</text></g>
          <g className="map-station map-station-paper"><circle cx="104" cy="68" r="7" /><text x="130" y="73">Поддержка HR</text></g>
          <g className="map-station map-station-paper"><circle cx="416" cy="430" r="7" /><text x="365" y="462">AI Jana</text><text className="map-mini-label" x="455" y="434">03</text></g>
        </g>
        <g className="map-hub" transform="translate(270 268)"><circle r="53" className="map-hub-orbit" /><circle r="36" className="map-hub-core" /><text y="6" textAnchor="middle">ВЫ</text><path d="M-6-47H6M-6 47H6" className="map-hub-tick" /></g>
        <g className="map-destination"><circle cx="480" cy="350" r="18" /><path d="m473 350 5 5 9-10" /><text x="403" y="391">Всё решено</text></g>
        <g className="map-route-tag" transform="translate(65 210)"><rect width="30" height="20" rx="3" /><text x="15" y="14" textAnchor="middle">01</text></g>
        <g className="map-route-tag map-route-tag-orange" transform="translate(295 161)"><rect width="30" height="20" rx="3" /><text x="15" y="14" textAnchor="middle">02</text></g>
        <g className="map-route-tag map-route-tag-paper" transform="translate(277 393)"><rect width="30" height="20" rx="3" /><text x="15" y="14" textAnchor="middle">03</text></g>
      </svg>
      <figcaption id="process-caption" className="process-caption"><span className="map-caption-symbol" aria-hidden="true">↳</span><span>Разные задачи.<br /><strong>Одно пространство.</strong></span><span className="eyebrow map-caption-index">ЧЕЛОВЕК<br />В ЦЕНТРЕ</span></figcaption>
      <div className="process-legend" aria-label="Маршруты"><span><i className="legend-line legend-mint" />Запросы</span><span><i className="legend-line legend-orange" />Развитие</span><span><i className="legend-line legend-paper" />Поддержка</span></div>
    </figure>
  )
}
