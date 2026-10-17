import { useEffect, useRef } from 'react'
import { screenUrl, type Screen } from '../assets/screens'

export function ScreenInspector({ screen, onClose }: { screen: Screen; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close() }, [])
  return <dialog ref={dialog} className="inspector" aria-labelledby="screen-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === dialog.current) onClose() }}>
    <div className="inspector-header"><h2 id="screen-title">{screen.title}</h2><button onClick={onClose} aria-label="Закрыть скриншот" autoFocus>×</button></div>
    <p>{screen.detail} Скриншот работающего JanaМен на вымышленных данных. Это презентация, действия в ней не изменяют продукт.</p>
    <div className="inspector-image"><img src={screenUrl(screen)} alt={screen.detail} /></div>
  </dialog>
}
