// Original vector artwork. No real transport brand or external 3D asset.
export function Truck() {
  return <svg className="film-truck" viewBox="0 0 800 400" aria-label="Фура как художественная метафора движения запроса" role="img">
    <defs>
      <linearGradient id="truck-side" x1="0" y1="0" x2="0.9" y2="1"><stop stopColor="#344a40" /><stop offset=".45" stopColor="#1c2b24" /><stop offset="1" stopColor="#111e18" /></linearGradient>
      <linearGradient id="truck-roof" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#789486" /><stop offset=".35" stopColor="#3d5347" /><stop offset="1" stopColor="#22372b" /></linearGradient>
      <linearGradient id="truck-window" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8fada0" /><stop offset=".2" stopColor="#325446" /><stop offset="1" stopColor="#0c1712" /></linearGradient>
      <radialGradient id="truck-shadow"><stop stopColor="#000" stopOpacity=".8" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="395" cy="328" rx="385" ry="55" fill="url(#truck-shadow)" />
    <path d="M73 277H472L500 245H693L724 281L684 312H84Z" fill="#0b130f" stroke="#415b4b" />
    <path d="M74 103L126 60H501L452 103Z" fill="url(#truck-roof)" stroke="#8fcfa9" strokeOpacity=".65" />
    <path d="M74 103H452V278H74Z" fill="url(#truck-side)" stroke="#647d6d" strokeWidth="1.5" />
    <path d="M452 103L501 60V235L452 278Z" fill="#263e30" stroke="#6b8b75" />
    <path d="M83 116H442M83 265H441M93 121V258M431 121V258" fill="none" stroke="#455f4d" />
    {[139, 193, 247, 301, 355, 409].map(x => <path key={x} d={`M${x} 120V257`} stroke="#3c5043" strokeWidth="1" />)}
    <path d="M78 106H450M79 275H450" stroke="#b5e8c5" strokeWidth="2.5" />
    <path d="M493 147L535 111H621L683 159L647 195L589 149Z" fill="url(#truck-roof)" stroke="#92b69f" />
    <path d="M493 147H589L647 195L668 273H493Z" fill="url(#truck-side)" stroke="#8ca893" strokeWidth="1.5" />
    <path d="M647 195L683 159L707 235L668 273Z" fill="#314a3b" stroke="#8ca893" />
    <path d="M506 158H579L616 188H506Z" fill="url(#truck-window)" stroke="#648d76" />
    <path d="M625 190L654 174L671 221L641 238Z" fill="url(#truck-window)" stroke="#648d76" />
    <path d="M506 201H616L628 249H506Z" fill="#1c3023" stroke="#516b59" />
    <path d="M516 212H529M668 259L704 228M654 247L695 214" stroke="#8fa895" strokeWidth="2" />
    <path d="M682 260L713 235L721 258L690 283Z" fill="#111e17" stroke="#4d6656" />
    <path d="M689 265L716 243" stroke="#f5f3ee" strokeWidth="4" />
    <path d="M75 258V271" stroke="#d98755" strokeWidth="5" />
    <path d="M102 283H431M499 277H628" stroke="#7ba88b" strokeWidth="2" />
    {[142, 205, 538, 635].map((x, i) => <g key={x} className="truck-wheel"><circle cx={x} cy="294" r={i < 2 ? 29 : 31} fill="#080f0b" stroke="#46614e" strokeWidth="3" /><circle cx={x} cy="294" r="17" fill="#243e2d" stroke="#748c7a" strokeWidth="2" /><circle cx={x} cy="294" r="5" fill="#a9bcaa" /><path className="wheel-spoke" data-x={x} d={`M${x - 12} 294h24M${x} 282v24`} stroke="#637b69" strokeWidth="2" /></g>)}
    <path d="M719 250L790 221M720 263L793 250" stroke="#e8ffee" strokeOpacity=".35" />
    <path d="M102 131H179" stroke="#8fcfa9" strokeWidth="2" /><text x="101" y="154" fill="#8caa96" fontFamily="Plex, monospace" fontSize="10" letterSpacing="3">REQUEST / 001</text>
  </svg>
}
