import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

function captureErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('requestfailed', (request) => { if (!request.failure()?.errorText.includes('ERR_ABORTED')) errors.push(request.url()) })
  return errors
}

async function expectNoOverflow(page: Page) {
  const widths = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }))
  expect(widths.content).toBeLessThanOrEqual(widths.viewport)
}

async function login(page: Page, role = 'Сотрудник') {
  await page.goto('/login')
  await page.getByRole('radio', { name: new RegExp(`^${role}`) }).check()
  await page.getByRole('button', { name: 'Войти в пространство' }).click()
  await expect(page.locator('.app-shell')).toBeVisible()
}

for (const width of [1440, 390]) {
  test(`login and shell screenshots at ${width}px, no overflow or console errors`, async ({ page }) => {
    const errors = captureErrors(page)
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Работа — в вашем ритме.' })).toBeVisible()
    await expect(page.locator('.login-page')).toHaveAttribute('data-intro', 'complete')
    await expect(page.locator('.cta-sweep')).toHaveCSS('opacity', '0')
    await page.evaluate(() => document.fonts.ready)
    await expectNoOverflow(page)
    await mkdir('artifacts/screenshots', { recursive: true })
    await page.screenshot({ path: `artifacts/screenshots/login-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Войти в пространство' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Личный кабинет.' })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: `artifacts/screenshots/shell-${width}.png`, animations: 'disabled' })
    expect(errors).toEqual([])
  })
}

for (const role of [
  { name: 'Сотрудник', path: '/dashboard', extra: 'Мой день' },
  { name: 'Руководитель', path: '/manager/approvals', extra: 'Согласования' },
  { name: 'HR / Админ', path: '/hr', extra: 'Обзор HR' },
]) {
  test(`demo role ${role.name}: navigation, refresh and logout`, async ({ page }) => {
    const errors = captureErrors(page)
    await login(page, role.name)
    await expect(page).toHaveURL(role.path)
    await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: new RegExp(role.extra) })).toHaveAttribute('aria-current', 'page')
    await page.reload()
    await expect(page.locator('.app-shell')).toBeVisible()
    await page.getByRole('button', { name: 'Меню демо-профиля' }).click()
    await page.getByRole('button', { name: 'Выйти из демо' }).click()
    await expect(page).toHaveURL('/login')
    await page.goto(role.path)
    await expect(page).toHaveURL('/login')
    expect(errors).toEqual([])
  })
}

test('keyboard login, menu Escape and notification route', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('.login-page')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Перейти ко входу' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: 'RU', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: /^Сотрудник/ })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: /^Руководитель/ })).toBeChecked()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/manager/approvals')
  const trigger = page.getByRole('button', { name: 'Меню демо-профиля' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('link', { name: 'Уведомления — 0 новых' }).click()
  await expect(page).toHaveURL('/notifications')
  await expect(page.locator('#workspace-content')).toBeFocused()
})

test('mobile navigation is modal, keyboard accessible and role-aware', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page, 'HR / Админ')
  const trigger = page.getByRole('button', { name: 'Все разделы' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Ваши маршруты' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Закрыть навигацию' })).toBeFocused()
  await expectNoOverflow(page)
  await page.screenshot({ path: 'artifacts/screenshots/navigation-390.png' })
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await dialog.getByRole('link', { name: /База знаний/ }).click()
  await expect(page).toHaveURL('/hr/knowledge')
  await expect(dialog).not.toBeVisible()
  await expect(page.locator('#workspace-content')).toBeFocused()
})

test('reduced motion and return to login do not replay the intro', async ({ page }) => {
  const errors = captureErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/login')
  await expect(page.locator('.login-page')).toHaveAttribute('data-intro', 'complete')
  const initialTransform = await page.locator('.js-title-line').first().evaluate((element) => getComputedStyle(element).transform)
  expect(initialTransform).toBe('none')
  await page.getByRole('button', { name: 'Войти в пространство' }).click()
  await page.getByRole('button', { name: 'Меню демо-профиля' }).click()
  await page.getByRole('button', { name: 'Сменить демо-роль' }).click()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('.login-page')).toHaveAttribute('data-intro', 'complete')
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
  expect(errors).toEqual([])
})

test('demo navigation boundaries, invalid role, 404 and narrow widths', async ({ page }) => {
  await page.goto('/login')
  await page.evaluate(() => sessionStorage.setItem('jana.demo-role.v1', 'invalid-role'))
  await page.reload()
  await expect(page.locator('.login-page')).toBeVisible()
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expectNoOverflow(page)
  }
  await page.getByRole('button', { name: 'Войти в пространство' }).click()
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expectNoOverflow(page)
  }
  await page.goto('/hr/requests')
  await expect(page).toHaveURL('/forbidden')
  await page.goto('/unknown-route')
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible()
})
