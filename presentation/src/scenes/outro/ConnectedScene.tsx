import { filmAsset } from './config'

export function ConnectedScene() {
  return <div className="film-connected-world">
    <svg className="film-connected-lines" viewBox="0 0 1920 1080" aria-hidden="true"><path d="M360 800V890Q360 930 400 930H1520Q1560 930 1560 890V800M960 800V930" fill="none" stroke="#8fcfa9" strokeWidth="2" /><circle cx="960" cy="930" r="7" fill="#8fcfa9" /></svg>
    <div className="film-connected-card film-hr-card"><span className="mono">01 / ДЕЙСТВОВАТЬ</span><h2>HR-заявки</h2><div><img src={filmAsset('flow-approved')} alt="Согласованная заявка: решение принято и уведомление создано" /></div></div>
    <div className="film-connected-card film-academy-card"><span className="mono">02 / РАЗВИВАТЬСЯ</span><h2>Jana Academy</h2><div><img src={filmAsset('academy-completed')} alt="Тест сдан на 100%, результат сохранён в профиле" /></div><span className="film-course-result">100% <small>Тест сдан. Прогресс сохранён.</small></span></div>
    <div className="film-connected-card film-ai-card"><span className="mono">03 / НАХОДИТЬ ОТВЕТ</span><h2>AI Jana</h2><div><img src={filmAsset('ai-answer')} alt="Ответ AI со ссылкой на оригинальный источник" /></div></div>
    <div className="film-source-card"><span className="mono">ОТКРЫТ ПЕРВОИСТОЧНИК ↗</span><div><img src={filmAsset('ai-source')} alt="Открытая статья об отпуске из разрешённой базы знаний" /></div></div>
  </div>
}
