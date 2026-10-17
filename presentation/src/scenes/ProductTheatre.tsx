import { screens, screenUrl, type Screen } from '../assets/screens'

export function ProductTheatre({ onInspect }: { onInspect: (screen: Screen) => void }) {
  return <div className="product-theatre">
    <div className="theatre-label mono"><span><i /> РЕАЛЬНЫЙ ПРОДУКТ</span><span>REACT → FASTAPI → POSTGRESQL</span></div>
    <div className="screen-stack">
      {screens.slice(0, 5).map((screen, i) => <button key={screen.id} className={`product-frame product-frame-${i}`} data-screen={screen.id} onClick={() => onInspect(screen)} aria-label={`Увеличить: ${screen.title}`} tabIndex={i === 4 ? 0 : -1}>
        <span className="screen-bar"><span className="window-dots"><i /><i /><i /></span><span className="mono">{screen.role} / {screen.title}</span><span>↗</span></span>
        <span className={`screenshot-viewport shot-${screen.id}`}><img src={screenUrl(screen)} alt={screen.detail} draggable={false} /></span>
      </button>)}
      <span className="screen-corner mono">СНИМОК ДЕМО-СРЕДЫ / НЕ LIVE</span>
    </div>
    <div className="support-panels">{screens.slice(5).map((screen, i) => <button className={`support-panel support-${i}`} key={screen.id} onClick={() => onInspect(screen)} aria-label={`Увеличить: ${screen.title}`}><div><span className="mono">{i === 0 ? 'LEARN /' : 'ASK /'}</span><strong>{screen.title}</strong><span>↗</span></div><img src={screenUrl(screen)} alt={screen.detail} draggable={false} /></button>)}</div>
  </div>
}
