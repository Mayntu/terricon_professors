import { networkPaths, logoPaths } from './paths'

export function BrandResolve() {
  return <>
    <svg className="film-brand-network" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs><filter id="brand-glow"><feGaussianBlur stdDeviation="3" /></filter></defs>
      <g className="film-network-paths">{networkPaths.map((d, i) => <path key={i} className={`film-gather-path gather-${i}`} d={d} />)}</g>
      <g className="film-logo-nodes"><circle cx="735" cy="305" r="29" /><circle cx="1185" cy="535" r="29" /></g>
      <path className="film-logo-shimmer" d={logoPaths[0]} />
      <circle className="film-logo-pulse" r="12" fill="#f5f3ee" />
    </svg>
    <div className="film-end-card"><div className="film-end-kicker mono">JANA / THE FLOW</div><div className="film-end-mask"><h1>Jana<span>Мен</span></h1></div><p>От запроса — к результату<span>.</span></p><div className="film-end-authors"><span>Бондарев Владислав</span><span>Хуснуллил Даниил</span></div></div>
  </>
}
