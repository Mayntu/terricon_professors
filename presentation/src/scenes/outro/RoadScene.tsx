import { Truck } from './Truck'

export function RoadScene() {
  return <div className="film-road-world">
    <svg className="film-road-grid" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs><pattern id="film-grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#8fcfa9" strokeOpacity=".09" /></pattern></defs>
      <rect width="1920" height="1080" fill="url(#film-grid)" />
      <g className="road-surface"><path d="M-400 1060L2300 190L2400 600L-200 1470Z" fill="#16271d" /><path d="M-400 1060L2300 190M-300 1270L2400 400" stroke="#486e55" strokeWidth="2" /><path className="road-stripes" d="M-400 1165L2350 295" fill="none" stroke="#84af91" strokeWidth="2" strokeDasharray="48 90" /><path className="road-trail" d="M-400 1120L2350 250" fill="none" stroke="#8fcfa9" strokeWidth="5" /><path d="M-200 850L2050 120M-100 980L2150 250M340 1100L2700 340M-300 600L1800 0" fill="none" stroke="#3a5542" strokeWidth="1" /></g>
      <g fill="#8fcfa9">{Array.from({ length: 18 }, (_, i) => <circle key={i} cx={(i * 271 + 130) % 1850} cy={(i * 137 + 230) % 950} r={i % 3 === 0 ? 2 : 1} opacity=".5" />)}</g>
    </svg>
    <div className="film-truck-track"><Truck /></div>
    <div className="film-portal"><div /><i /><i /><i /></div>
    <div className="road-coordinates mono">FLOW COORDINATES<br /><span>43°14′ N / 76°56′ E</span></div>
  </div>
}
