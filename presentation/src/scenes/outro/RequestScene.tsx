import { filmAsset } from './config'

export function RequestScene() {
  return <div className="film-request-world">
    <div className="film-request-label mono">EMPLOYEE / ОТПУСК</div>
    <div className="film-request-panel">
      <div className="film-window-bar"><span className="mono">JanaМен / Личное пространство</span><span>01 — ЗАЯВКА</span></div>
      <div className="film-request-clip"><img className="film-form-empty" src={filmAsset('leave-empty')} alt="Настоящая форма отпуска JanaМен до выбора дат" /><img className="film-form-filled" src={filmAsset('leave-filled')} alt="Та же форма с выбранными датами" /></div>
    </div>
    <img className="film-submit-dialog" src={filmAsset('leave-confirm')} alt="Подтверждение отправки заявки на отпуск" />
    <svg className="film-cursor" viewBox="0 0 30 38" aria-hidden="true"><path d="M2 2L25 23H15L21 34L15 37L9 25L2 31Z" fill="#101b18" stroke="#f5f3ee" strokeWidth="2" /></svg>
    <div className="film-click-ring" aria-hidden="true" />
    <div className="film-data-signal" aria-hidden="true"><i /><i /><i /></div>
  </div>
}
