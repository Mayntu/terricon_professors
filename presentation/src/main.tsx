import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Presentation } from './controller/Presentation'
import { CinematicOutro } from './scenes/outro/CinematicOutro'
import './styles/fonts.css'
import './styles/deck.css'

const rendering = new URLSearchParams(location.search).get('render') === 'outro'
createRoot(document.getElementById('root')!).render(<StrictMode>{rendering ? <CinematicOutro renderMode /> : <Presentation />}</StrictMode>)
