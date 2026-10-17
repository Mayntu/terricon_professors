import { expect, test } from '@playwright/test'
import { API, loginAs, noOverflow, resetDemo, shot } from './helpers'

test.beforeEach(async ({ page }) => { await resetDemo(page) })

test('анонимное обращение: подача → HR видит без автора → ответ → автор видит ответ', async ({ page }) => {
  await loginAs(page, 'aigerim', '/grievances')
  await page.getByLabel('Тема').selectOption('manager')
  await page.getByLabel('Что произошло').fill('Руководитель смены повышает голос на сотрудников')
  await expect(page.getByLabel('Подать анонимно')).toBeChecked()
  await shot(page, 'grievance-form-1440')
  await page.getByRole('button', { name: 'Отправить обращение' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'отправлено' })).toBeVisible()
  await expect(page.getByTestId('grievances-mine')).toContainText('Ждёт ответа HR')

  await loginAs(page, 'daniyar', '/hr/inbox')
  const item = page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'повышает голос' })
  await expect(item.getByTestId('author')).toHaveText('Анонимный автор')
  await expect(page.locator('body')).not.toContainText('Айгерим')
  await shot(page, 'hr-inbox-1440')
  await item.getByLabel('Ответ').fill('Провели беседу с руководителем смены, ситуация на контроле HR.')
  await item.getByRole('button', { name: 'Ответить' }).click()
  await expect(page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'повышает голос' })).toHaveCount(0)

  await loginAs(page, 'aigerim', '/grievances')
  await expect(page.getByTestId('grievances-mine')).toContainText('Провели беседу')
})

test('HR отвечает на вопрос из AI Jana', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr/inbox')
  await page.getByRole('radio', { name: 'Вопросы к HR' }).check({ force: true })
  const item = page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'ночные смены' })
  await expect(item.getByTestId('author')).toHaveText('Нурлан Абенов')
  await item.getByLabel('Ответ').fill('Ночные смены оплачиваются с доплатой 50% к ставке.')
  await item.getByRole('button', { name: 'Ответить' }).click()
  await expect(page.getByTestId('hr-inbox').locator('li').filter({ hasText: 'ночные смены' })).toHaveCount(0)
})

test('руководитель не видит обращений; 375 px', async ({ page }) => {
  const a = await (await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'aigerim' } })).json()
  await page.request.post(`${API}/api/ext/grievances`, { headers: { Authorization: `Bearer ${a.accessToken}` }, data: { category: 'other', text: 'Обращение для проверки руководителя', anonymous: false } })
  const m = await (await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'erlan' } })).json()
  const inbox = await (await page.request.get(`${API}/api/requests/inbox?status=all`, { headers: { Authorization: `Bearer ${m.accessToken}` } })).json()
  expect(inbox.items.filter((r: { type: string }) => r.type === 'grievance')).toHaveLength(0)
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAs(page, 'aigerim', '/grievances')
  await noOverflow(page)
  await shot(page, 'grievance-375')
})
