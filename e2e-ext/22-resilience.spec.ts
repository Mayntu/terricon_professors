import { appendFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { expect, test, type Page } from '@playwright/test'
import { API, loginAs, resetDemo } from './helpers'

/** §5–6 финальной проверки: «нажали не туда» и устойчивость. Белого экрана быть не должно нигде. */
test.beforeEach(async ({ page }) => { await resetDemo(page) })
const OUT = process.env.QA_OUT
function pageErrors(page: Page) { const e: string[] = []; page.on('pageerror', (x) => e.push(`${page.url()}: ${x.message}`)); return e }
async function notBlank(page: Page) {
  await expect(page.locator('#root')).not.toBeEmpty()
  expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(20)
}
const ROUTES: Record<string, string[]> = {
  aigerim: ['/dashboard', '/profile', '/requests', '/requests/new/leave', '/notifications', '/academy', '/academy/course-safety', '/ai-jana', '/wage', '/grievances', '/shifts'],
  erlan: ['/manager/approvals', '/manager/team', '/manager/learning', '/manager/xray', '/shifts'],
  daniyar: ['/hr', '/hr/requests', '/hr/employees', '/hr/inbox', '/hr/learning', '/hr/knowledge', '/hr/policies'],
}

test('все экраны: загрузка, обновление страницы, «назад» — без белого экрана; время загрузки', async ({ page }) => {
  test.setTimeout(180_000) // Все роли, десятки переходов и reload на Docker Desktop.
  const errors = pageErrors(page)
  const slow: string[] = []
  for (const [login, routes] of Object.entries(ROUTES)) {
    await loginAs(page, login, routes[0])
    for (const r of routes) {
      const t0 = Date.now()
      await page.goto(r)
      await notBlank(page)
      await expect(page.locator('.query-loading')).toHaveCount(0, { timeout: 10_000 })
      const ms = Date.now() - t0
      if (ms > 1000) slow.push(`${login} ${r}: ${ms} ms`)
      await page.reload()
      await notBlank(page)
    }
    for (let i = 0; i < 3; i++) { await page.goBack(); await notBlank(page) }
  }
  if (OUT) appendFileSync(OUT, JSON.stringify({ slowPages: slow }) + '\n')
  expect(errors).toEqual([])
})

test('двойной клик по «Отправить заявку» создаёт одну заявку', async ({ page }) => {
  await loginAs(page, 'asel', '/requests/new/leave')
  const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
  await page.getByLabel('Первый день', { exact: true }).fill(day(30))
  await page.getByLabel('Последний день', { exact: true }).fill(day(31))
  await page.getByRole('button', { name: 'Проверить заявку' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Отправить заявку', exact: true }).dblclick()
  await expect(page.locator('.creation-confirmation')).toBeVisible()
  const t = (await (await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'asel' } })).json()).accessToken
  const mine = await (await page.request.get(`${API}/api/requests/my?type=vacation`, { headers: { Authorization: `Bearer ${t}` } })).json()
  expect(mine.items.filter((r: { status: string }) => r.status === 'Submitted')).toHaveLength(1)
})

test('та же страница во второй вкладке работает', async ({ page, context }) => {
  const errors = pageErrors(page)
  await loginAs(page, 'aigerim', '/wage')
  const [second] = await Promise.all([context.waitForEvent('page'), page.evaluate(() => window.open(location.href, '_blank'))])
  pageErrors(second)
  await second.waitForLoadState()
  await notBlank(second)
  await expect(second.getByTestId('wage-available')).toHaveText('84 000 ₸')
  expect(errors).toEqual([])
})

test('битый и истёкший токен — на вход, без белого экрана', async ({ page }) => {
  const errors = pageErrors(page)
  await loginAs(page, 'aigerim', '/wage')
  await page.evaluate(() => sessionStorage.setItem('jana.api-token.v1', 'garbage.token.value'))
  await page.reload()
  await expect(page).toHaveURL(/\/login/)
  await notBlank(page)
  // «истёкший»: валидная подпись невозможна без секрета — проверяем подменённый payload
  await loginAs(page, 'aigerim', '/profile')
  await page.evaluate(() => { const [h, , s] = sessionStorage.getItem('jana.api-token.v1')!.split('.'); sessionStorage.setItem('jana.api-token.v1', `${h}.${btoa(JSON.stringify({ sub: 'emp-aigerim', exp: 1 }))}.${s}`) })
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
  await notBlank(page)
  expect(errors).toEqual([])
})

test('медленная сеть: состояния загрузки, кнопка подтверждения не нажимается дважды', async ({ page }) => {
  await loginAs(page, 'aigerim', '/dashboard')
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 1500, downloadThroughput: 50_000, uploadThroughput: 50_000 })
  // Переход внутри SPA проверяет задержку данных, без повторной загрузки dev-бандла под ограничением 50 КБ/с.
  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Зарплата по факту', exact: true }).click()
  await expect(page.locator('.query-loading').first()).toBeVisible()
  await expect(page.getByTestId('wage-available')).toBeVisible({ timeout: 30_000 })
  await page.getByLabel('Сумма').fill('10000')
  await page.getByRole('button', { name: /^Получить 10 000/ }).click()
  const ok = page.getByRole('dialog').getByRole('button', { name: /Подтвердить|Отправляем/ })
  await ok.click()
  await expect(page.getByRole('dialog').locator('button[aria-busy="true"]')).toBeDisabled()
  await expect(page.getByTestId('wage-sent')).toBeVisible({ timeout: 30_000 })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  const t = (await (await page.request.post(`${API}/api/demo/login-as`, { data: { login: 'aigerim' } })).json()).accessToken
  expect((await (await page.request.get(`${API}/api/ext/wage/summary`, { headers: { Authorization: `Bearer ${t}` } })).json()).withdrawn).toBe(10000)
})

test('пустые состояния: человек без заявок, курсов, уведомлений', async ({ page }) => {
  const errors = pageErrors(page)
  await loginAs(page, 'gulnara', '/requests')
  for (const r of ['/requests', '/academy', '/notifications', '/grievances', '/wage']) {
    await page.goto(r)
    await notBlank(page)
    await expect(page.locator('.query-loading')).toHaveCount(0, { timeout: 10_000 })
    expect(await page.locator('main').innerText()).not.toMatch(/undefined|NaN|null|Invalid Date/)
    await page.screenshot({ path: `docs/screenshots/features/empty-${r.replaceAll('/', '') || 'root'}.png`, fullPage: true })
  }
  expect(errors).toEqual([])
})

test('перезапуск бэкенда при открытом фронте: понятная ошибка и восстановление', async ({ page }) => {
  test.skip(!process.env.QA_DOCKER, 'перезапуск контейнера — только при QA_DOCKER=1')
  test.setTimeout(180_000)
  const errors = pageErrors(page)
  await loginAs(page, 'aigerim', '/wage')
  execSync('docker compose stop backend', { stdio: 'ignore' })
  await page.goto('/profile')
  await notBlank(page)
  await expect(page.locator('body')).toContainText('Сервер JanaМен недоступен', { timeout: 20_000 })
  await page.screenshot({ path: 'docs/screenshots/features/backend-down.png', fullPage: true })
  execSync('docker compose start backend', { stdio: 'ignore' })
  await expect.poll(async () => (await page.request.get(`${API}/api/health`).catch(() => null))?.status() ?? 0, { timeout: 90_000 }).toBe(200)
  await page.goto('/wage')
  await expect(page.getByTestId('wage-available')).toBeVisible({ timeout: 20_000 })
  expect(errors).toEqual([])
})
