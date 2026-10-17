const base = `${import.meta.env.BASE_URL}assets/product/`
export const screens = [
  { id: 'dashboard', title: 'Личный кабинет', role: 'Employee', file: 'dashboard.png', detail: 'Реальный Dashboard сотрудника JanaМен.' },
  { id: 'leave-request', title: 'Заявка на отпуск', role: 'Employee', file: 'leave-request.png', detail: 'Заявка, даты и фактический статус из FastAPI.' },
  { id: 'flow-map', title: 'Jana Flow Map', role: 'Employee', file: 'flow-map.png', detail: 'Текущий ответственный и следующие этапы согласования.' },
  { id: 'manager-decision', title: 'Решение руководителя', role: 'Manager', file: 'manager-decision.png', detail: 'Настоящий интерфейс решения по заявке.' },
  { id: 'approved', title: 'Подтверждённое решение', role: 'Employee', file: 'approved.png', detail: 'Ранее согласованная тестовая заявка из сквозной проверки. Отдельная запись, не изменение заявки во время показа.' },
  { id: 'academy', title: 'Jana Academy', role: 'Employee', file: 'academy.png', detail: 'Курсы и сохранённый учебный прогресс.' },
  { id: 'ai-jana', title: 'AI Jana', role: 'Employee', file: 'ai-jana.png', detail: 'Ответ из базы знаний со ссылкой на источник.' },
] as const
export type Screen = (typeof screens)[number]
export const screenUrl = (screen: Screen) => `${base}${screen.file}`
