export function SlideChrome({ chapter, label, light = false }: { chapter: string; label: string; light?: boolean }) {
  return <>
    <header className={`slide-header ${light ? 'ink' : ''}`}>
      <div className="wordmark"><svg viewBox="0 0 42 36" aria-hidden="true"><path d="M5 3v16c0 8 5 12 13 12h19M18 10v9h19" /><circle cx="5" cy="3" r="3" /><circle cx="18" cy="10" r="3" /><circle cx="37" cy="19" r="3" /></svg><span>JANA <i>/</i> THE FLOW</span></div>
      <span className="mono">DIGITAL HR · TERRICON VALLEY</span>
    </header>
    <footer className={`slide-footer ${light ? 'ink' : ''}`}><span className="mono">{chapter} <i>/</i> {label}</span><span className="mono">JANAМЕН · 2026</span></footer>
  </>
}
