import { routes } from '../animations/tokens'

export function RouteCanvas() {
  return <svg className="route-canvas" viewBox="0 0 1920 1080" aria-hidden="true">
    <defs>
      <pattern id="coordinate-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M 80 0 H 0 V 80" fill="none" stroke="currentColor" strokeWidth="0.5" /></pattern>
      <filter id="signal-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="8" /></filter>
    </defs>
    <rect className="coordinate-grid" width="1920" height="1080" fill="url(#coordinate-grid)" />
    <g className="route-camera">
      <path className="route-track" d={routes[0]} />
      <path className="route-main" d={routes[0]} />
      <g className="route-signal"><circle r="20" fill="#8FCFA9" filter="url(#signal-glow)" /><circle r="5" fill="#F5F3EE" /></g>
    </g>
    <g className="registration-marks" stroke="currentColor" fill="none"><path d="M 60 100 V 60 H 100 M 1820 60 H 1860 V 100 M 60 980 V 1020 H 100 M 1820 1020 H 1860 V 980" /></g>
  </svg>
}
