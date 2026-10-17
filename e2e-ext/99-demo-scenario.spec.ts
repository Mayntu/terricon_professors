import { expect, test, type Page } from '@playwright/test'
import { API, loginAs, resetDemo } from './helpers'

/** Сквозной демо-сценарий CLAUDE.md §12 в собранном приложении: от входа Айгерим до 10,8 млн ₸. */
test.setTimeout(180_000)

async function ask(page: Page, q: string) {
  await page.getByPlaceholder('Например').fill(q)
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  return page.getByTestId('ai-answer').last()
}

test('демо §12 целиком', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`))
  await resetDemo(page)

  await test.step('1. Айгерим: главная и лестница в профиле', async () => {
    await loginAs(page, 'aigerim')
    await expect(page.getByTestId('wage-widget').getByTestId('wage-available')).toHaveText('84 000 ₸')
    await expect(page.getByRole('heading', { name: 'Мои гарантии' })).toBeVisible()
    await expect(page.getByText(/Ответ по заявке/).first()).toBeVisible()
    await page.goto('/profile')
    await expect(page.getByTestId('ladder-remaining')).toContainText('Осталось: 1 курс → +35 000 ₸')
  })

  await test.step('2. «Зарплата по факту» 60 000 ₸ → заявка «одобрено системой»', async () => {
    await page.goto('/dashboard')
    await page.getByTestId('wage-widget').getByRole('link', { name: 'Получить' }).click()
    await page.getByLabel('Сумма').fill('60000')
    await page.getByRole('button', { name: /^Получить 60 000 ₸/ }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Подтвердить' }).click()
    await expect(page.getByTestId('wage-sent')).toContainText('Деньги отправлены')
  })

  await test.step('3. Ерлан: отказ без причины невозможен; чужая смена — 403', async () => {
    await loginAs(page, 'erlan', '/manager/approvals')
    await page.locator('.request-number').first().click()
    await page.getByRole('radio', { name: 'Отклонить' }).check({ force: true })
    await page.locator('.decision-panel textarea').fill('Без причины из справочника')
    await expect(page.getByRole('button', { name: 'Подтвердить отклонение' })).toBeDisabled()
    const { accessToken } = await (await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'erlan' } })).json()
    const headers = { Authorization: `Bearer ${accessToken}` }
    const direct = await page.request.post(`${API}/api/requests/${page.url().split('/').pop()}/decide`, { headers, data: { decision: 'Rejected', comment: 'Без причины из справочника' } })
    expect((await direct.json()).code).toBe('REASON_REQUIRED')
    expect((await page.request.get(`${API}/api/employees/emp-asel`, { headers })).status()).toBe(403)
  })

  await test.step('4. «+2 дня» → отпуск «Одобрено по сроку»', async () => {
    await page.request.post(`${API}/api/demo/advance-time`, { data: { hours: 48 } })
    await loginAs(page, 'aigerim', '/requests')
    await expect(page.getByTestId('guarantee-badge').filter({ hasText: 'Одобрено по сроку' }).first()).toBeVisible()
  })

  await test.step('5. Айгерим проходит курс → «все условия выполнены»', async () => {
    await page.goto('/profile')
    await page.getByTestId('ladder').getByRole('link', { name: 'Перейти к курсу' }).click()
    await page.getByTestId('course-lessons').getByRole('link', { name: 'Продолжить' }).click()
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Урок изучен/ }).click()
    const sets = page.locator('.ext-question')
    for (const [i, a] of [1, 1, 1, 0].entries()) await sets.nth(i).locator('input').nth(a).check()
    await page.getByRole('button', { name: 'Отправить ответы' }).click()
    await expect(page.getByTestId('test-result')).toContainText('Тест сдан')
    await page.goto('/profile')
    await expect(page.getByTestId('ladder-remaining')).toContainText('Все условия выполнены')
  })

  await test.step('6. AI Jana: KZ/KG источники, отказ, «нет информации» → «Спросить HR»', async () => {
    await page.goto('/ai-jana')
    await expect(await ask(page, 'Сколько дней отпуска положено?')).toContainText('ТК РК')
    await expect(await ask(page, 'Какая зарплата у моего начальника?')).toContainText('Защита данных')
    const night = await ask(page, 'Как оплачиваются ночные смены?')
    await expect(night).toContainText('Надёжной информации')
    await night.getByRole('button', { name: 'Спросить HR' }).click()
    await expect(night.getByRole('status')).toContainText('Вопрос передан в HR')
    await loginAs(page, 'bakyt', '/ai-jana')
    await expect(await ask(page, 'Сколько дней отпуска положено?')).toContainText('ТК КР')
  })

  await test.step('7. Данияр: радар → пересмотр → «остался» = 10,8 млн ₸', async () => {
    await loginAs(page, 'daniyar', '/hr')
    await expect(page.getByTestId('hr-savings')).toContainText('9 900 000 ₸')
    await expect(page.locator('.ext-risk[data-employee="emp-nurlan"]')).toBeVisible()
    const aigerim = page.locator('.ext-risk[data-employee="emp-aigerim"]')
    await expect(aigerim.locator('li[data-kind="pay_equity"]')).toBeVisible()
    await aigerim.locator('li[data-kind="no_review"]').getByRole('button', { name: 'Предложить пересмотр' }).click()
    await expect(aigerim).toContainText('Пересмотр назначен на')
    await aigerim.locator('li[data-kind="no_review"]').getByRole('button', { name: 'Сотрудник остался' }).click()
    await expect(page.getByTestId('hr-savings')).toContainText('10 800 000 ₸')
  })

  await test.step('8. Рентген: Ерлан наверху; пробелы базы → публикация → AI отвечает', async () => {
    await page.getByRole('radio', { name: 'Рентген' }).check({ force: true })
    await expect(page.getByTestId('xray-table').locator('tbody tr').first()).toContainText('Ерлан')
    await page.goto('/hr/knowledge')
    await page.getByTestId('kb-gaps').locator('li[data-gap]').first().getByRole('button', { name: 'Подготовить черновик' }).click()
    const editor = page.getByTestId('kb-editor')
    await editor.getByLabel(/Текст правила/).fill('## Оплата ночных смен\nНочные смены оплачиваются с доплатой 50% к ставке за смену.')
    await editor.getByRole('button', { name: 'Опубликовать' }).click()
    await expect(editor.getByRole('status')).toContainText('Опубликовано')
    await loginAs(page, 'aigerim', '/ai-jana')
    await expect(await ask(page, 'Как оплачиваются ночные смены?')).toContainText('Внутреннее правило')
  })

  await test.step('9. Биржа смен: Айгерим отдаёт, Асель берёт', async () => {
    await page.goto('/shifts')
    await page.getByTestId('shifts-mine').locator('li').first().getByRole('button', { name: 'Отдать смену' }).click()
    await expect(page.getByTestId('shifts-mine').locator('li').first()).toContainText('Выставлена на биржу')
    await loginAs(page, 'asel', '/shifts')
    const offer = page.getByTestId('shifts-available').locator('li').filter({ hasText: 'Айгерим' }).first()
    await expect(offer.getByRole('button')).toContainText('+12 000 ₸')
    await offer.getByRole('button').click()
    await expect(page.getByTestId('shifts-available').locator('li').filter({ hasText: 'Айгерим' })).toHaveCount(0)
  })

  expect(errors, 'ошибки на странице').toEqual([])
})
