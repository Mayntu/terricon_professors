import { expect, test } from '@playwright/test'
import { loginAs, resetDemo } from './helpers'

/** Регрессии, найденные при финальной проверке (docs/FINAL_QA.md). Каждый тест сначала ловил баг. */
test.beforeEach(async ({ page }) => { await resetDemo(page) })

test('QA-01: в меню нет ключей i18n вместо текста — у всех ролей', async ({ page }) => {
  for (const login of ['aigerim', 'erlan', 'daniyar']) {
    await loginAs(page, login, '/dashboard')
    const nav = page.getByRole('navigation', { name: 'Основная навигация' })
    await expect(nav).toBeVisible()
    expect(await nav.innerText()).not.toMatch(/\b[a-z]+\.[a-z][a-z.]*\b/)
  }
})

test('QA-02: остаток отпуска учитывает заявки на рассмотрении (21 − 7 = 14) — профиль и форма', async ({ page }) => {
  await loginAs(page, 'aigerim', '/profile')
  await expect(page.locator('main')).toContainText('14 календ. дн.')
  await page.goto('/requests/new/leave')
  await expect(page.locator('.leave-balance, main').first()).toContainText('14')
  await expect(page.locator('main')).not.toContainText('21')
})

test('QA-03: в профиле есть назначенное обучение с прогрессом и сроком', async ({ page }) => {
  await loginAs(page, 'aigerim', '/profile')
  const block = page.getByTestId('assigned-training')
  await expect(block).toContainText('Работа с возвратами')
  await expect(block).toContainText('Пройден')
  await expect(block).toContainText('Техника безопасности на сортировке')
  await expect(block).toContainText('25%')
  await expect(block).toContainText('30 окт')
})

test('QA-09: кнопка DEMO оформлена на любой странице, даже без других ext-блоков', async ({ page }) => {
  for (const path of ['/requests/new/leave', '/hr/requests']) {
    await loginAs(page, 'aigerim', path)
    const fab = page.getByRole('button', { name: 'Демо-панель' })
    await expect(fab).toBeVisible()
    expect(await fab.evaluate((el) => getComputedStyle(el).position)).toBe('fixed')
  }
})
