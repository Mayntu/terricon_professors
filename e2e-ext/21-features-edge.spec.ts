import { expect, test, type Page } from '@playwright/test'
import { API, loginAs, resetDemo } from './helpers'

/** §4 финальной проверки: главный сценарий и крайние случаи ext-фич через UI. Скриншоты — docs/screenshots/features/. */
test.beforeEach(async ({ page }) => { await resetDemo(page) })
const shot = (page: Page, name: string) => page.screenshot({ path: `docs/screenshots/features/${name}.png`, fullPage: true })
async function token(page: Page, login: string) {
  return (await (await page.request.post(`${API}/api/demo/login-as`, { data: { login } })).json()).accessToken as string
}
async function apiGet(page: Page, login: string, path: string) {
  return (await page.request.get(`${API}/api${path}`, { headers: { Authorization: `Bearer ${await token(page, login)}` } })).json()
}

test('«Мои гарантии»: цифры совпадают с данными API', async ({ page }) => {
  const s = await apiGet(page, 'aigerim', '/ext/guarantees/summary/me')
  await loginAs(page, 'aigerim', '/dashboard')
  const w = page.getByTestId('guarantees-widget')
  await expect(w).toContainText(String(s.rejectionsWithoutReason))
  if (s.decidedTotal) await expect(w).toContainText(`${s.decidedOnTime} из ${s.decidedTotal}`)
  await expect(page.getByTestId('wage-widget').getByTestId('wage-available')).toHaveText('84 000 ₸')
  await shot(page, 'guarantees-widget')
})

test('«Зарплата по факту»: ниже минимума, больше доступного, двойной клик, третий вывод, «Почему столько»', async ({ page }) => {
  await loginAs(page, 'aigerim', '/wage')
  await expect(page.locator('main')).toContainText('заработано 168 000 ₸')
  await page.getByLabel('Сумма').fill('4000')
  await page.getByRole('button', { name: /^Получить/ }).click()
  await expect(page.getByRole('alert')).toContainText('5 000 ₸')
  await page.getByLabel('Сумма').fill('90000')
  await page.getByRole('button', { name: /^Получить/ }).click()
  await expect(page.getByRole('alert')).toContainText('84 000 ₸')
  await shot(page, 'wage-errors')
  // двойной клик по «Подтвердить» — один вывод
  await page.getByLabel('Сумма').fill('60000')
  await page.getByRole('button', { name: /^Получить 60 000/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Подтвердить' }).dblclick()
  await expect(page.getByTestId('wage-sent')).toBeVisible()
  const after1 = await apiGet(page, 'aigerim', '/ext/wage/summary')
  expect(after1.withdrawn).toBe(60000)
  expect(after1.available).toBe(24000)
  // второй вывод — последний разрешённый, третий недоступен
  await page.getByRole('button', { name: 'Готово' }).click()
  await page.getByLabel('Сумма').fill('10000')
  await page.getByRole('button', { name: /^Получить 10 000/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Подтвердить' }).click()
  await expect(page.getByTestId('wage-sent')).toBeVisible()
  await page.getByRole('button', { name: 'Готово' }).click()
  await expect(page.getByLabel('Сумма')).toHaveCount(0)
  await expect(page.locator('main')).toContainText('0 / 2')
  await shot(page, 'wage-limit-reached')
  const third = await page.request.post(`${API}/api/ext/wage/withdraw`, { headers: { Authorization: `Bearer ${await token(page, 'aigerim')}` }, data: { amount: 5000 } })
  expect((await third.json()).code).toBe('LIMIT_PER_PERIOD')
  // «Почему столько» сходится с выводами
  await page.getByRole('radio', { name: 'Почему столько' }).check({ force: true })
  const why = page.getByTestId('wage-why')
  await expect(why).toContainText('− 70 000 ₸')
  const slip = await apiGet(page, 'aigerim', '/ext/wage/payslip-explained')
  expect(slip.alreadyReceived).toBe(70000)
  expect(slip.toBePaid).toBe(slip.net - 70000)
  await shot(page, 'wage-why-after')
  // заявки «одобрено системой» в «Моих заявках»
  const mine = await apiGet(page, 'aigerim', '/requests/my?type=wage_access')
  expect(mine.items).toHaveLength(2)
  expect(mine.items.every((r: { status: string; decidedBySystem: boolean }) => r.status === 'Approved' && r.decidedBySystem)).toBe(true)
})

test('политики: новый срок реально меняет срок новой заявки', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr/policies')
  const row = page.getByTestId('policies').locator('li[data-type="vacation"]')
  await row.getByLabel('Срок ответа, ч').fill('24')
  await row.getByRole('button', { name: 'Сохранить' }).click()
  await expect(row.getByRole('status')).toBeVisible()
  await shot(page, 'policies-edited')
  const t = await token(page, 'asel')
  const start = new Date(Date.now() + 50 * 86_400_000).toISOString().slice(0, 10)
  const end = new Date(Date.now() + 51 * 86_400_000).toISOString().slice(0, 10)
  const r = await (await page.request.post(`${API}/api/leave`, { headers: { Authorization: `Bearer ${t}` }, data: { startDate: start, endDate: end, submissionKey: `qa-${Date.now()}` } })).json()
  const full = await (await page.request.get(`${API}/api/requests/${r.id}`, { headers: { Authorization: `Bearer ${t}` } })).json()
  const hours = (Date.parse(full.extensions.guarantee.deadlineAt) - Date.parse(full.createdAt)) / 3_600_000
  expect(Math.round(hours)).toBe(24)
})

test('HR-пульт → пересмотр: уведомление у сотрудника и новая дата в лестнице', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr')
  const card = page.locator('.ext-risk[data-employee="emp-aigerim"]')
  for (const kind of ['no_review', 'pay_equity']) await expect(card.locator(`li[data-kind="${kind}"]`)).toBeVisible()
  for (const kind of ['rejections', 'slow_answers', 'open_grievance']) await expect(page.locator(`.ext-risk[data-employee="emp-nurlan"] li[data-kind="${kind}"]`)).toBeVisible()
  await card.locator('li[data-kind="no_review"]').getByRole('button', { name: 'Предложить пересмотр' }).click()
  await expect(card).toContainText('Пересмотр назначен на')
  const date = (await card.innerText()).match(/Пересмотр назначен на ([^\n·]+)/)![1].trim()
  await loginAs(page, 'aigerim', '/notifications')
  await expect(page.locator('main')).toContainText('пересмотр')
  await page.goto('/profile')
  await expect(page.getByTestId('ladder')).toContainText(date)
  await shot(page, 'ladder-review-date')
})

test('лестница: сотрудник получает только свой и следующий грейд; бейдж в Academy', async ({ page }) => {
  const me = await apiGet(page, 'aigerim', '/ext/ladder/me')
  const text = JSON.stringify(me)
  expect(text).toContain('SORT-1')
  expect(text).toContain('SORT-2')
  expect(text).not.toContain('SORT-3')
  expect(text).not.toContain('KG-')
  const hr = await page.request.get(`${API}/api/ext/ladder/grades?country=KZ`, { headers: { Authorization: `Bearer ${await token(page, 'aigerim')}` } })
  expect(hr.status()).toBe(403)
  await loginAs(page, 'aigerim', '/academy')
  await expect(page.getByTestId('grade-tag').first()).toContainText('SORT-2')
})

test('анонимное обращение: автор не виден HR нигде — карточка, реестр с фильтрами, входящие, радар, уведомления', async ({ page }) => {
  const t = await token(page, 'asel')
  await page.request.post(`${API}/api/ext/grievances`, { headers: { Authorization: `Bearer ${t}` }, data: { category: 'manager', text: 'Анонимно: на смене А не дают перерыв', anonymous: true } })
  await page.request.post(`${API}/api/demo/advance-time`, { data: { hours: 100 } })
  for (const path of ['/hr/inbox', '/hr/requests', '/hr', '/notifications']) {
    await loginAs(page, 'daniyar', path)
    await page.waitForLoadState('networkidle')
    if (path === '/hr/requests') { await page.getByLabel('Тип').selectOption('grievance'); await expect(page.getByTestId('registry')).toContainText('Анонимно') }
    if (path === '/hr/inbox') {
      const item = page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'перерыв' })
      await expect(item.getByTestId('author')).toHaveText('Анонимный автор')
      await expect(item).not.toContainText('Асель')
    }
    if (path === '/hr') await expect(page.locator('.ext-risk[data-employee="emp-asel"] li[data-kind="open_grievance"]')).toHaveCount(0)
    if (path === '/notifications') await expect(page.locator('main')).not.toContainText('Асель')
  }
  await page.goto('/hr/requests')
  await page.getByLabel('Страна').selectOption('KZ')
  await page.getByLabel('Тип').selectOption('grievance')
  await expect(page.getByTestId('registry').locator('li')).toHaveCount(0)  // фильтр, сужающий круг, не показывает анонимное
  for (const path of ['/requests/all?type=grievance', '/requests/inbox?status=all&type=grievance', '/ext/hr/risks?country=KZ', '/notifications']) {
    const body = JSON.stringify(await apiGet(page, 'daniyar', path))
    if (body.includes('перерыв')) expect(body).not.toContain('emp-asel')
  }
  await shot(page, 'grievance-anonymous-hr')
})

test('пробелы базы: новый вопрос вне базы попадает в группу', async ({ page }) => {
  const before = await apiGet(page, 'daniyar', '/ext/kb/gaps?country=KZ')
  const night = before.find((g: { label: string }) => /ночн/i.test(g.label))
  await loginAs(page, 'aigerim', '/ai-jana')
  await page.getByPlaceholder('Например').fill('Какая доплата за ночную смену?')
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  await expect(page.getByTestId('ai-answer').last()).toContainText('Надёжной информации')
  const after = await apiGet(page, 'daniyar', '/ext/kb/gaps?country=KZ')
  const g = after.find((x: { id: string }) => x.id === night.id)
  expect(g.count).toBe(night.count + 1)
})

test('биржа смен: чужая квалификация недоступна, двое не могут взять одну смену', async ({ page }) => {
  const ta = await token(page, 'aigerim')
  const my = await (await page.request.get(`${API}/api/ext/shifts/my`, { headers: { Authorization: `Bearer ${ta}` } })).json()
  const shift = my.items[0]
  await page.request.post(`${API}/api/ext/shifts/${shift.id}/offer`, { headers: { Authorization: `Bearer ${ta}` } })
  // Нурлан — та же смена Б и квалификация, но смена пересекается с его графиком или нет — берём Асель и Нурлана одновременно
  const [r1, r2] = await Promise.all(['asel', 'nurlan'].map(async (l) => page.request.post(`${API}/api/ext/shifts/${shift.id}/take`, { headers: { Authorization: `Bearer ${await token(page, l)}` } })))
  const statuses = [r1!.status(), r2!.status()].sort()
  expect(statuses.filter((s) => s === 200)).toHaveLength(1)
  // руководитель/HR публикуют смену с другой квалификацией → сотрудник с sorter её не видит и не может взять
  const th = await token(page, 'daniyar')
  const day = new Date(Date.now() + 9 * 86_400_000).toISOString().slice(0, 10)
  const open = await (await page.request.post(`${API}/api/ext/shifts`, { headers: { Authorization: `Bearer ${th}` }, data: { centerId: 'kz-almaty-sc', date: day, startTime: '08:00', endTime: '20:00', payPreview: 15000, qualification: 'forklift' } })).json()
  const avail = await (await page.request.get(`${API}/api/ext/shifts/available`, { headers: { Authorization: `Bearer ${await token(page, 'asel')}` } })).json()
  expect(avail.items.map((s: { id: string }) => s.id)).not.toContain(open.id)
  const take = await page.request.post(`${API}/api/ext/shifts/${open.id}/take`, { headers: { Authorization: `Bearer ${await token(page, 'asel')}` } })
  expect((await take.json()).code).toBe('QUALIFICATION_MISMATCH')
})

test('демо-панель: вход за всех 8 персонажей, +2 дня, сброс дважды', async ({ page }) => {
  await loginAs(page, 'aigerim', '/dashboard')
  for (const name of ['Нурлан', 'Асель', 'Ерлан', 'Гульнара', 'Данияр', 'Бакыт', 'Айбек', 'Айгерим']) {
    await page.getByRole('button', { name: 'Демо-панель' }).click()
    await page.getByTestId('demo-panel').getByRole('button', { name: new RegExp(name) }).click()
    // Панель меняет персонажа через полную навигацию: дождаться нового профиля, прежде чем читать sessionStorage.
    await expect(page.locator('.user-menu-trigger')).toContainText(name)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('.app-shell')).toBeVisible()
    await expect.poll(async () => {
      const me = await page.evaluate(async (api) => (await fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('jana.api-token.v1')}` } })).json(), API)
      return String(me.displayName ?? me.name)
    }).toContain(name)
    await expect(page.locator('main')).toBeVisible()
  }
  await page.getByRole('button', { name: 'Демо-панель' }).click()
  const panel = page.getByTestId('demo-panel')
  await panel.getByRole('button', { name: '+2 дня' }).click()
  await expect(panel.getByRole('status')).toContainText('Время платформы')
  for (let i = 0; i < 2; i++) {
    const reset = page.waitForResponse(r => r.url().endsWith('/api/demo/reset') && r.request().method() === 'POST')
    await panel.getByRole('button', { name: 'Сброс данных' }).click()
    expect((await reset).status()).toBe(200)
    await expect(panel.getByRole('button', { name: 'Сброс данных' })).toBeEnabled()
    await expect(panel.getByRole('status')).toContainText('Время платформы')
  }
  await page.reload()
  await expect(page.locator('.app-shell')).toBeVisible()
  await shot(page, 'demo-panel-after-reset')
})
