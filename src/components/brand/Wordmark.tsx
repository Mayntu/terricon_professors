export function Wordmark() {
  return (
    <span className="wordmark" aria-label="JanaМен">
      <svg aria-hidden="true" width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 5v11a7 7 0 0 0 7 7h11M14 5v8a1 1 0 0 0 1 1h8" stroke="currentColor" strokeWidth="2" />
        <circle cx="5" cy="5" r="3" fill="currentColor" />
        <circle cx="23" cy="14" r="3" fill="currentColor" />
      </svg>
      <span aria-hidden="true">Jana<span className="text-brand">Мен</span></span>
    </span>
  )
}
