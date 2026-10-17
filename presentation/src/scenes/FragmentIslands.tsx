export function FragmentIslands() {
  return <div className="island-space" aria-label="Пять разрозненных HR-разделов">
    <svg className="broken-routes" viewBox="0 0 900 850" aria-hidden="true"><path d="M230 160V270H400 M460 270H690V370 M690 410V530H500 M440 530H215V660 M215 700H530" /><g><path d="m420 258-14 24m38-24-14 24M678 388l24-12M678 402l24-12M462 518l-14 24m38-24-14 24" /></g></svg>
    <article className="island island-profile"><div className="island-head mono"><span>01 / ПРОФИЛЬ</span><span>↗</span></div><div className="profile-fragment"><div className="avatar">АС</div><div><strong>Айгерим</strong><span>Сотрудник</span></div></div><div className="fragment-lines"><i /><i /></div></article>
    <article className="island island-request"><div className="island-head mono"><span>02 / ЗАЯВЛЕНИЕ</span><span>↗</span></div><strong className="island-title">Отпуск</strong><div className="paper-lines"><i /><i /><i /></div><span className="isolated-tag">Ожидает решения</span></article>
    <article className="island island-learning"><div className="island-head mono"><span>03 / ОБУЧЕНИЕ</span><span>↗</span></div><strong className="island-title">Academy</strong><div className="lesson-blocks"><i /><i /><i /><i /></div><span className="mono muted">УРОК → ТЕСТ → РЕЗУЛЬТАТ</span></article>
    <article className="island island-notification"><div className="island-head mono"><span>04 / УВЕДОМЛЕНИЯ</span><span>↗</span></div><div className="notification-fragment"><span className="fragment-bell">◉</span><div><strong>Новое событие</strong><div className="fragment-lines"><i /><i /></div></div></div></article>
    <article className="island island-question"><div className="island-head mono"><span>05 / ВОПРОС HR</span><span>↗</span></div><strong className="island-title">Где мой ответ?</strong><div className="question-dots"><i /><i /><i /></div></article>
    <div className="disconnect-label mono">NO SHARED ROUTE <span>×</span></div>
  </div>
}
