import { expect, test, type Page } from '@playwright/test'
import { API, loginAs, noOverflow, resetDemo } from './helpers'

test.setTimeout(120_000)
test.beforeEach(async ({ page }) => { await resetDemo(page) })
async function headers(page: Page) {
  return { Authorization: `Bearer ${await page.evaluate(() => sessionStorage.getItem('jana.api-token.v1'))}` }
}

test('HR assigns → notification → lessons → failed test → retry → persisted completion', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await loginAs(page, 'daniyar', '/hr/learning')
  await page.locator('.ext-form select').nth(0).selectOption('emp-nurlan')
  await page.locator('.ext-form select').nth(1).selectOption('course-returns')
  await page.getByRole('button', { name: 'Назначить курс' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Курс назначен' })).toBeVisible()
  await loginAs(page, 'nurlan', '/notifications')
  await page.locator('.notifications-list > li').filter({ hasText: 'Работа с возвратами' }).first().getByRole('link').click()
  await expect(page).toHaveURL(/\/academy\/course-returns$/)
  await page.getByRole('link', { name: 'Перейти к тесту' }).click()
  await expect(page.getByTestId('test-locked')).toBeVisible()
  await page.getByTestId('test-locked').getByRole('link').click()
  for (let i = 1; i <= 3; i++) {
    await expect(page).toHaveURL(new RegExp(`/lessons/l-ret-${i}$`))
    await expect(page.locator('.route-frame[data-present="true"]').getByTestId('lesson-content')).not.toBeEmpty()
    await page.getByRole('button', { name: /Урок изучен/ }).click()
  }
  await expect(page.getByTestId('test-form')).toBeVisible()
  for (const set of await page.locator('.ext-question').all()) await set.locator('input').first().check()
  await page.getByRole('button', { name: 'Отправить ответы' }).click()
  await expect(page.getByTestId('test-result')).toContainText('Можно пересдать')
  await page.reload()
  await expect(page.getByTestId('test-result')).toContainText('Можно пересдать')
  await page.getByRole('button', { name: 'Пересдать' }).click()
  for (const set of await page.locator('.ext-question').all()) await set.locator('input').nth(1).check()
  await page.getByRole('button', { name: 'Отправить ответы' }).click()
  await expect(page.getByTestId('test-result')).toContainText('Тест сдан: 100%')
  await page.reload()
  await expect(page.getByTestId('test-result')).toContainText('Тест сдан: 100%')
  await page.goto('/profile')
  await expect(page.getByTestId('assigned-training')).toContainText('Пройден')
  const course = (await (await page.request.get(`${API}/api/academy/courses/course-returns`, { headers: await headers(page) })).json())
  expect(course.progress).toMatchObject({ status: 'Completed', scorePercent: 100, lessonsPercent: 100 })
  expect(errors).toEqual([])
})

test('lesson write error stays on lesson and allows retry', async ({ page }) => {
  await loginAs(page, 'aigerim', '/academy/course-safety/lessons/l-saf-2')
  await page.route('**/api/academy/lessons/l-saf-2/complete', route => route.fulfill({ status: 503, json: { kind: 'unavailable', message: 'Тест: урок не сохранён' } }))
  await page.getByRole('button', { name: /Урок изучен/ }).click()
  await expect(page.getByRole('alert')).toContainText('урок не сохранён')
  await expect(page).toHaveURL(/lessons\/l-saf-2$/)
  await page.unroute('**/api/academy/lessons/l-saf-2/complete')
  await page.getByRole('button', { name: /Урок изучен/ }).click()
  await expect(page).toHaveURL(/lessons\/l-saf-3$/)
})

test('AI source opens the exact section of the permitted original document', async ({ page }) => {
  await loginAs(page, 'aigerim', '/ai-jana')
  await page.getByRole('button', { name: 'Сколько дней отпуска положено?' }).click()
  const answer = page.getByTestId('ai-answer').last()
  await expect(answer).toContainText('24 календарных дня')
  const source = answer.locator('.ext-sources a').first()
  const href = (await source.getAttribute('href'))!
  expect(href).toMatch(/\/knowledge\/kb-kz-vacation#section-\d+/)
  await source.click()
  const section = page.locator(new URL(page.url()).hash)
  await expect(section).toContainText('24 календарных дня')
  await expect(section).toBeFocused()
  await expect(page.locator('main')).toContainText('без автоматического перевода')
  const back = page.locator('.back-link')
  await back.focus()
  const refresh = page.waitForResponse(r => r.url().includes('/api/ai/sources/kb-kz-vacation') && r.request().method() === 'GET')
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await refresh
  await expect(back).toBeFocused()
})

test('unknown AI question → failed HR send → double click → one request → private HR answer notification', async ({ page }) => {
  await loginAs(page, 'aigerim', '/ai-jana')
  const question = 'Как получить справку для визы?'
  await page.getByPlaceholder('Например').fill(question)
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  await expect(page.getByTestId('ai-answer').last()).toHaveAttribute('data-kind', 'no-answer')
  await page.route('**/api/hr-questions', route => route.fulfill({ status: 503, json: { kind: 'unavailable', message: 'Тест: попробуйте снова' } }))
  await page.getByRole('button', { name: 'Спросить HR', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('попробуйте снова')
  await page.unroute('**/api/hr-questions')
  let sends = 0
  page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith('/api/hr-questions')) sends++ })
  await page.getByRole('button', { name: 'Спросить HR', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click() })
  await expect(page.getByRole('status').filter({ hasText: 'Вопрос передан в HR' })).toBeVisible()
  expect(sends).toBe(1)
  await page.getByRole('link', { name: 'Открыть обращение' }).click()
  await expect(page.getByTestId('hr-request')).toContainText(question)
  const id = new URL(page.url()).pathname.split('/').at(-1)!
  const number = (await page.getByRole('heading', { level: 1 }).textContent())!.trim().replace(/\.$/, '')
  await loginAs(page, 'daniyar', `/requests/${id}`)
  await page.getByLabel('Ответ сотруднику').fill('Ваш личный ответ: справку подготовит ваш HR.')
  await page.getByRole('button', { name: 'Сохранить решение' }).click()
  await expect(page.getByTestId('hr-request-history')).toContainText('Ваш личный ответ')
  await loginAs(page, 'aigerim', '/notifications')
  await page.locator('.notifications-list > li').filter({ hasText: number }).filter({ hasText: 'Ваш личный ответ' }).getByRole('link').click()
  await expect(page.getByTestId('hr-request-history')).toContainText('Ваш личный ответ')
})

test('KB draft failure exposes retry, unreviewed template cannot publish', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr/knowledge')
  await page.route('**/api/ext/kb/gaps/*/draft', route => route.fulfill({ status: 503, json: { kind: 'unavailable', message: 'Тест: черновик недоступен' } }))
  await page.getByRole('button', { name: 'Подготовить черновик' }).first().click()
  await expect(page.getByRole('alert')).toContainText('черновик недоступен')
  await page.unroute('**/api/ext/kb/gaps/*/draft')
  await page.getByRole('button', { name: 'Попробовать ещё раз' }).click()
  await expect(page.getByTestId('kb-editor')).toBeVisible()
  await page.getByRole('button', { name: 'Опубликовать', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Заполните и проверьте')
})

for (const width of [360, 390]) {
  test(`RU/KZ mobile navigation and primary screens ${width}px with reduced motion`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await loginAs(page, 'aigerim')
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible()
    await expect(page.locator('.demo-footnote').last()).not.toContainText('в этом браузере')
    await page.locator('.user-menu-trigger').click()
    await page.locator('.user-popover').getByRole('radio', { name: 'KZ', exact: true }).check()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Жеке кабинет' })).toBeVisible()
    await page.getByRole('button', { name: 'Барлық бөлімдер' }).click()
    await page.getByRole('dialog').getByRole('link', { name: /Менің өтінімдерім/ }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    for (const path of ['/dashboard', '/profile', '/requests', '/requests/new/leave', '/notifications', '/academy', '/ai-jana']) {
      await page.goto(path)
      await expect(page.locator('.workspace-main h1')).toBeVisible()
      await expect(page.locator('.query-loading')).toHaveCount(0)
      await noOverflow(page)
      await expect(page.locator('body')).not.toContainText('undefined')
      await expect(page.locator('body')).not.toContainText(/\bM(?:0[1-9]|1[0-2])\b/)
    }
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Жеке кабинет' })).toBeVisible()
    await expect(page.locator('.query-loading')).toHaveCount(0)
    await page.screenshot({ path: `artifacts/mvp-dashboard-kk-${width}.png`, fullPage: true })
    await page.locator('.user-menu-trigger').click()
    await page.getByRole('button', { name: 'Демодан шығу' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('button', { name: 'Кіру', exact: true })).toBeVisible()
    await noOverflow(page)
    await page.screenshot({ path: `artifacts/mvp-login-kk-${width}.png`, fullPage: true })
    for (const [role, routes] of Object.entries({ erlan: ['/manager/approvals', '/manager/team'], daniyar: ['/hr', '/hr/requests', '/hr/learning', '/hr/knowledge'] })) {
      await loginAs(page, role, routes[0])
      for (const path of routes) {
        await page.goto(path)
        await expect(page.locator('.workspace-main h1')).toBeVisible()
        await expect(page.locator('.query-loading')).toHaveCount(0)
        await noOverflow(page)
      }
    }
    expect(errors).toEqual([])
  })
}
