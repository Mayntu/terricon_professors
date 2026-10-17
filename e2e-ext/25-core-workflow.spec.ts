import { expect, test, type Page } from '@playwright/test'
import { API, resetDemo } from './helpers'

test.setTimeout(120_000)

async function passwordLogin(page: Page, login: string) {
  await page.goto('/login')
  await page.evaluate(() => sessionStorage.clear())
  await page.goto('/login')
  await page.getByLabel('Логин', { exact: true }).fill(login)
  await page.getByLabel('Пароль', { exact: true }).fill('demo1234')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.locator('.app-shell')).toBeVisible()
}

async function headers(page: Page) {
  return { Authorization: `Bearer ${await page.evaluate(() => sessionStorage.getItem('jana.api-token.v1'))}` }
}

async function createLeave(page: Page) {
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Айгерим Сейткали', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Оформить отпуск', exact: true }).click()
  const start = new Date(Date.now() + 100 * 86400000).toISOString().slice(0, 10)
  const end = new Date(Date.now() + 102 * 86400000).toISOString().slice(0, 10)
  await page.getByLabel('Первый день', { exact: true }).fill(start)
  await page.getByLabel('Последний день', { exact: true }).fill(end)
  await page.getByRole('button', { name: 'Проверить заявку' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Отправить заявку', exact: true }).click()
  await expect(page.locator('.creation-confirmation')).toBeVisible()
  const id = new URL(page.url()).pathname.split('/').at(-1)!
  const number = (await page.locator('.creation-confirmation strong').textContent())!
  return { id, number }
}

test.describe('React → FastAPI → PostgreSQL', () => {
  test.skip(!!process.env.QA_NORMAL_MODE, 'Demo clock/reset are disabled in normal mode')
  test.beforeEach(async ({ page }) => { await resetDemo(page) })

  for (const route of ['manager', 'hr-approve', 'hr-reject'] as const) {
    test(`password login → leave → ${route} → history and persisted notification`, async ({ page }) => {
      const errors: string[] = []
      const demoLogins: string[] = []
      page.on('pageerror', e => errors.push(e.message))
      page.on('request', r => { if (r.url().includes('/demo/login-as')) demoLogins.push(r.url()) })
      await passwordLogin(page, 'aigerim')
      const employeeHeaders = await headers(page)
      const before = (await (await page.request.get(`${API}/api/leave/balance`, { headers: employeeHeaders })).json()).availableDays
      const { id, number } = await createLeave(page)
      expect((await (await page.request.get(`${API}/api/leave/balance`, { headers: employeeHeaders })).json()).availableDays).toBe(before - 3)
      if (route !== 'manager') {
        expect((await page.request.post(`${API}/api/demo/advance-time`, { data: { hours: 49 } })).ok()).toBeTruthy()
        await page.reload()
        await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Escalated')
        await expect(page.locator('.flow-stations [aria-current="step"]')).toContainText('У HR')
        await expect(page.locator('.flow-stations [data-state="waiting"]')).toHaveCount(1)
        await page.screenshot({ path: `artifacts/${route}-flow.png`, fullPage: true })
        await passwordLogin(page, 'erlan')
        await page.goto(`/manager/approvals/${id}`)
        await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Escalated')
        await expect(page.locator('.decision-panel')).toHaveCount(0)
      }
      await passwordLogin(page, route === 'manager' ? 'erlan' : 'daniyar')
      await page.goto(route === 'manager' ? '/manager/approvals' : '/hr/requests')
      await page.getByRole('link', { name: number, exact: true }).click()
      const rejected = route === 'hr-reject'
      if (rejected) {
        await page.getByRole('radio', { name: 'Отклонить', exact: true }).check({ force: true })
        await expect(page.getByRole('button', { name: 'Подтвердить отклонение' })).toBeDisabled()
        await page.locator('.decision-panel textarea').fill('Период совпадает с обязательной работой команды.')
        await page.locator('.decision-panel select').selectOption('OTHER')
      }
      await page.getByRole('button', { name: rejected ? 'Подтвердить отклонение' : 'Подтвердить согласование' }).click()
      await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', rejected ? 'Rejected' : 'Approved')
      await expect(page.locator('.decision-panel')).toHaveCount(0)
      await passwordLogin(page, 'aigerim')
      await page.goto('/notifications')
      const notice = page.locator('.notifications-list > li').filter({ hasText: number }).filter({ hasText: rejected ? 'отказ' : 'одобрено' }).first()
      await expect(notice).toBeVisible()
      await notice.getByRole('button', { name: 'Отметить прочитанным' }).click()
      await page.reload()
      await expect(notice).toContainText('Прочитано')
      await notice.getByRole('link', { name: 'Открыть результат' }).click()
      await expect(page).toHaveURL(new RegExp(`/requests/${id}$`))
      await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', rejected ? 'Rejected' : 'Approved')
      await expect(page.locator('.request-history')).toContainText(route === 'manager' ? 'Ерлан' : 'Данияр')
      expect((await (await page.request.get(`${API}/api/leave/balance`, { headers: await headers(page) })).json()).availableDays).toBe(before - (rejected ? 0 : 3))
      expect(demoLogins).toEqual([])
      expect(errors).toEqual([])
    })
  }

  test('HR question and course notifications open their own cards', async ({ page }) => {
    const leaveFetches: string[] = []
    page.on('request', r => { if (/\/api\/leave\//.test(r.url())) leaveFetches.push(r.url()) })
    await passwordLogin(page, 'aigerim')
    const question = await page.request.post(`${API}/api/hr-questions`, { headers: await headers(page), data: { question: 'Как согласовать график работы после отпуска?' } })
    expect(question.status()).toBe(201)
    const q = await question.json()
    await page.goto('/requests')
    await page.getByRole('link', { name: q.number }).click()
    await expect(page.getByTestId('hr-request')).toContainText('Как согласовать график')
    await passwordLogin(page, 'daniyar')
    await page.goto('/notifications')
    await page.locator('.notifications-list > li').filter({ hasText: q.number }).getByRole('link').click()
    await page.getByLabel('Ответ сотруднику').fill('Обратитесь к руководителю для согласования графика.')
    await page.getByRole('button', { name: 'Сохранить решение' }).click()
    await expect(page.getByTestId('hr-request')).toContainText('Обратитесь к руководителю')
    await passwordLogin(page, 'aigerim')
    for (const lesson of ['l-saf-2', 'l-saf-3', 'l-saf-4']) {
      expect((await page.request.post(`${API}/api/academy/lessons/${lesson}/complete`, { headers: await headers(page) })).ok()).toBe(true)
    }
    const completed = await page.request.post(`${API}/api/academy/courses/course-safety/submit`, { headers: await headers(page), data: { answers: [1, 1, 1, 0] } })
    expect(completed.status()).toBe(200)
    expect((await completed.json()).passed).toBe(true)
    await page.goto('/notifications')
    await page.locator('.notifications-list > li').filter({ hasText: q.number }).filter({ hasText: 'Обратитесь к руководителю' }).getByRole('link').click()
    await expect(page.getByTestId('hr-request-history')).toContainText('Обратитесь к руководителю')
    await page.goto('/notifications')
    await page.locator('.notifications-list a[href="/academy/course-safety"]').first().click()
    await expect(page.getByTestId('course-lessons')).toBeVisible()
    expect(leaveFetches.filter(url => url.includes(q.id) || url.includes('course-safety'))).toEqual([])
  })
})

test('normal mode: password only, demo endpoints forbidden, logout and revoked session', async ({ page }) => {
  test.skip(!process.env.QA_NORMAL_MODE, 'Run against DEMO_MODE=false')
  const demoCalls: string[] = []
  page.on('request', r => { if (r.url().includes('/api/demo/')) demoCalls.push(r.url()) })
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Демонстрационный вход' })).toHaveCount(0)
  const config = await page.request.get(`${API}/api/auth/config`)
  expect((await config.json()).demoMode).toBe(false)
  expect((await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'aigerim' } })).status()).toBe(404)
  await passwordLogin(page, 'aigerim')
  const leave = await createLeave(page)
  await passwordLogin(page, 'erlan')
  await page.goto(`/manager/approvals/${leave.id}`)
  await page.getByRole('button', { name: 'Подтвердить согласование' }).click()
  await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Approved')
  await passwordLogin(page, 'aigerim')
  await page.goto('/notifications')
  await page.locator('.notifications-list > li').filter({ hasText: leave.number }).filter({ hasText: 'одобрено' }).getByRole('link').click()
  await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Approved')
  const oldHeaders = await headers(page)
  await page.locator('.user-menu-trigger').click()
  await expect(page.getByRole('button', { name: 'Сменить демо-роль' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect((await page.request.get(`${API}/api/auth/me`, { headers: oldHeaders })).status()).toBe(401)
  await passwordLogin(page, 'aigerim')
  await page.request.post(`${API}/api/auth/logout`, { headers: await headers(page) })
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => sessionStorage.getItem('jana.api-token.v1'))).toBeNull()
  expect(demoCalls).toEqual([])
})
