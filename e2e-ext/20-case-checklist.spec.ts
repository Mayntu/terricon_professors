import { expect, test, type Page } from '@playwright/test'
import { API, loginAs, resetDemo } from './helpers'

/** Чек-лист кейса (CLAUDE.md §12.1) через интерфейс, скриншот на каждый шаг — docs/screenshots/case/. */
test.setTimeout(240_000)
let n = 0
async function step(page: Page, name: string) {
  n += 1
  await page.addStyleTag({ content: '.skip-link{display:none!important}' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `docs/screenshots/case/${String(n).padStart(2, '0')}-${name}.png`, fullPage: true })
}
const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
async function uiLogin(page: Page, role: 'Сотрудник' | 'Руководитель' | 'HR') {
  await page.goto('/login')
  await page.evaluate(() => { sessionStorage.clear(); localStorage.setItem('jana.lang.v1', 'ru') })
  await page.goto('/login')
  await page.getByRole('button', { name: 'Демонстрационный вход', exact: true }).click()
  await page.locator('.role-option-content', { hasText: new RegExp(`^${role}`) }).click()
  await page.getByRole('button', { name: 'Войти в пространство' }).click()
  await expect(page.locator('.app-shell')).toBeVisible()
}
const nav = (page: Page) => page.getByRole('navigation', { name: 'Основная навигация' })

test('чек-лист кейса 12.1 через интерфейс', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`))
  await resetDemo(page)

  await test.step('вход и 3 роли: меню зависит от роли', async () => {
    await uiLogin(page, 'Сотрудник')
    await expect(page.locator('main')).toContainText('Айгерим Сейткали')
    await expect(nav(page)).not.toContainText('Согласования')
    await expect(nav(page)).not.toContainText('Реестр заявок')
    await step(page, 'employee-home')
    await uiLogin(page, 'Руководитель')
    await expect(nav(page)).toContainText('Согласования')
    await expect(nav(page)).toContainText('Моя команда')
    await expect(nav(page)).not.toContainText('Реестр заявок')
    await step(page, 'manager-home')
    await uiLogin(page, 'HR')
    await expect(nav(page)).toContainText('Реестр заявок')
    await expect(nav(page)).toContainText('Сотрудники')
    await step(page, 'hr-home')
    // сотрудник по прямому URL на раздел HR
    await loginAs(page, 'aigerim', '/hr/requests')
    await expect(page.getByTestId('registry')).toHaveCount(0)
    await step(page, 'employee-hr-url')
  })

  await test.step('профиль: все поля кейса', async () => {
    await loginAs(page, 'aigerim', '/profile')
    const main = page.locator('main')
    for (const text of <(string | RegExp)[]>['Айгерим Сейткали', 'Jana Post', 'Сортировщик', 'СЦ Алматы · смена Б', 'Ерлан Мухамедов', /3 июн[.я]* 2024/, '14 календ. дн.', 'Назначенное обучение', 'Техника безопасности на сортировке']) await expect(main).toContainText(text)
    await expect(page.locator('.notification-count')).toContainText('2')
    await step(page, 'profile')
  })

  await test.step('отпуск: ошибки дат и остатка', async () => {
    await page.goto('/requests/new/leave')
    await page.getByLabel('Первый день', { exact: true }).fill(day(45))
    await page.getByLabel('Последний день', { exact: true }).fill(day(43))
    await page.getByRole('button', { name: 'Проверить заявку' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await step(page, 'leave-error-dates')
    await page.getByLabel('Первый день', { exact: true }).fill(day(45))
    await page.getByLabel('Последний день', { exact: true }).fill(day(70))
    await page.getByRole('button', { name: 'Проверить заявку' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await step(page, 'leave-error-balance')
  })

  let number = ''
  await test.step('отпуск: создание, статус, история', async () => {
    await page.getByLabel('Первый день', { exact: true }).fill(day(45))
    await page.getByLabel('Последний день', { exact: true }).fill(day(47))
    await page.getByLabel('Комментарий руководителю').fill('Семейная поездка, задачи передам Асель')
    await page.getByRole('button', { name: 'Проверить заявку' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Отправить заявку', exact: true }).click()
    await expect(page.locator('.creation-confirmation')).toBeVisible()
    number = (await page.locator('.creation-confirmation strong').textContent())!
    await step(page, 'leave-created')
    await page.goto('/requests')
    const row = page.getByRole('row').filter({ hasText: number })
    await expect(row).toContainText('На согласовании')
    await expect(row).toContainText('Отпуск')
    await step(page, 'my-requests')
  })

  await test.step('руководитель: входящие, одобрение', async () => {
    await loginAs(page, 'erlan', '/manager/approvals')
    await page.getByRole('link', { name: number }).click()
    await page.getByRole('button', { name: 'Подтвердить согласование' }).click()
    await expect(page.locator('.decision-complete')).toBeVisible()
    await step(page, 'manager-approved')
  })

  await test.step('сотрудник: уведомление о решении, карточка с историей и документом', async () => {
    await loginAs(page, 'aigerim', '/notifications')
    const item = page.locator('main li').filter({ hasText: number }).first()
    await expect(item).toBeVisible()
    await step(page, 'notifications')
    await item.getByRole('link').click()
    await expect(page.locator('.request-status').first()).toContainText('Согласовано')
    await expect(page.locator('.request-history li')).toHaveCount(2)
    await expect(page.getByTestId('request-document')).toContainText('Приказ')
    await step(page, 'request-card-approved')
  })

  await test.step('Academy: назначение HR → уведомление → прохождение → уведомление о завершении → профиль', async () => {
    await loginAs(page, 'daniyar', '/hr/learning')
    await page.getByLabel('Сотрудник').selectOption('emp-nurlan')
    await page.getByLabel('Курс').selectOption('course-returns')
    await page.getByRole('button', { name: 'Назначить курс' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'назначен' })).toBeVisible()
    await step(page, 'hr-assign-course')
    await loginAs(page, 'nurlan', '/notifications')
    await expect(page.locator('main')).toContainText('Работа с возвратами')
    await step(page, 'nurlan-assigned-notification')
    await page.goto('/academy/course-safety')
    await page.getByTestId('course-lessons').getByRole('link').first().click()
    for (let i = 0; i < 4; i++) {  // в курсе 4 урока
      const url = page.url()
      await page.getByRole('button', { name: /Урок изучен/ }).click()
      await expect(page).not.toHaveURL(url)
    }
    await expect(page.getByTestId('test-form')).toBeVisible()
    const sets = page.locator('.ext-question')
    await expect(sets.first()).toBeVisible()
    for (const [i, a] of [1, 1, 1, 0].entries()) await sets.nth(i).locator('input').nth(a).check()
    await page.getByRole('button', { name: 'Отправить ответы' }).click()
    await expect(page.getByTestId('test-result')).toContainText('Тест сдан')
    await step(page, 'nurlan-test-passed')
    await page.goto('/notifications')
    await expect(page.locator('main')).toContainText('пройден')
    await page.goto('/profile')
    await expect(page.getByTestId('assigned-training')).toContainText('Пройден')
    await step(page, 'nurlan-profile-training')
  })

  await test.step('AI Jana: источник, вне базы → «Спросить HR», чужие данные → отказ', async () => {
    await page.goto('/ai-jana')
    const ask = async (q: string) => { await page.getByPlaceholder('Например').fill(q); await page.getByRole('button', { name: 'Спросить', exact: true }).click(); return page.getByTestId('ai-answer').last() }
    await expect(await ask('Сколько дней отпуска положено?')).toContainText('ТК РК')
    await expect(await ask('Сколько получает Айгерим?')).toContainText('Защита данных')
    const out = await ask('Положена ли компенсация за проезд на такси?')
    await expect(out).toContainText('Надёжной информации')
    await out.getByRole('button', { name: 'Спросить HR' }).click()
    await expect(out.getByRole('status')).toContainText('HQ-')
    await step(page, 'ai-jana')
  })

  await test.step('HR: реестр, сотрудники, ответ на вопрос из AI Jana', async () => {
    await loginAs(page, 'daniyar', '/hr/requests')
    await expect(page.getByTestId('registry').locator('li').first()).toBeVisible()
    await step(page, 'hr-registry')
    await page.goto('/hr/employees')
    await expect(page.getByTestId('people').locator('li')).toHaveCount(8)
    await step(page, 'hr-employees')
    await page.goto('/hr/inbox')
    await page.getByRole('radio', { name: 'Вопросы к HR' }).check({ force: true })
    const q = page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'такси' })
    await q.getByLabel('Ответ').fill('Компенсации такси нет, есть служебный автобус от метро.')
    await q.getByRole('button', { name: 'Ответить' }).click()
    await expect(page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'такси' })).toHaveCount(0)
    await step(page, 'hr-answered')
    await loginAs(page, 'nurlan', '/notifications')
    await expect(page.locator('main')).toContainText('HR ответил на ваш вопрос')
    await step(page, 'nurlan-hr-answer-notification')
  })

  await test.step('руководитель: чужой сотрудник — UI, прямой URL, API', async () => {
    await loginAs(page, 'erlan', '/manager/team')
    await expect(page.getByTestId('people')).not.toContainText('Асель')
    await page.goto('/employees/emp-asel')
    await expect(page.getByTestId('employee-forbidden')).toBeVisible()
    await step(page, 'manager-foreign-403')
    const { accessToken } = await (await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'erlan' } })).json()
    expect((await page.request.get(`${API}/api/employees/emp-asel`, { headers: { Authorization: `Bearer ${accessToken}` } })).status()).toBe(403)
  })

  expect(errors).toEqual([])
})
