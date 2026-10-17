import { filmAsset } from './config'

export const FLOW_PATH = 'M260 650H440C570 650 580 740 700 740H790C900 740 900 650 1010 650H1660'

export function FlowScene() {
  return <div className="film-flow-world">
    <svg className="film-flow-lines" viewBox="0 0 1920 1080" aria-hidden="true">
      <path className="film-flow-track" d={FLOW_PATH} />
      <path className="film-flow-active" d={FLOW_PATH} />
      <circle className="film-flow-pulse" r="7" fill="#f5f3ee" />
    </svg>
    <div className="film-flow-node film-employee"><i>01</i><strong>Employee</strong><span>Заявка отправлена</span></div>
    <div className="film-flow-node film-manager"><i>02</i><strong>Manager</strong><span>Подтверждает решение</span></div>
    <div className="film-flow-node film-result"><i><span className="result-wait">03</span><span className="result-check">✓</span></i><strong>Result</strong><span>История + уведомление</span></div>
    <div className="film-flow-original"><span className="mono">JANA FLOW MAP / РЕАЛЬНЫЙ ИНТЕРФЕЙС</span><img src={filmAsset('flow-submitted')} alt="Маршрут той же отправленной заявки" /></div>
    <div className="film-manager-screen"><span className="mono">MANAGER / РЕШЕНИЕ РУКОВОДИТЕЛЯ</span><img src={filmAsset('manager-confirm')} alt="Панель подтверждения согласования этой заявки" /></div>
    <svg className="film-manager-cursor" viewBox="0 0 30 38" aria-hidden="true"><path d="M2 2L25 23H15L21 34L15 37L9 25L2 31Z" fill="#101b18" stroke="#f5f3ee" strokeWidth="2" /></svg>
    <div className="film-manager-ring" aria-hidden="true" />
    <div className="film-approved-stamp"><span>✓</span><div><strong>Согласовано</strong><small>Решение сохранено в истории</small></div></div>
  </div>
}
