import { expect, test } from '@playwright/test'
import { loginAs, noOverflow, resetDemo, shot } from './helpers'

test.beforeEach(async ({ page }) => { await resetDemo(page) })

test('демо-панель: вход за Ерлана, +2 дня → отпуск Айгерим передан HR', async ({ page }) => {
  await loginAs(page, 'aigerim', '/dashboard')
  await page.getByRole('button', { name: 'Демо-панель' }).click()
  const panel = page.getByTestId('demo-panel')
  await shot(page, 'demo-panel-1440')
  await panel.getByRole('button', { name: /Ерлан/ }).click()
  await expect(page.locator('.sidebar-role')).toContainText('Руководитель')
  await page.getByRole('button', { name: 'Демо-панель' }).click()
  await page.getByTestId('demo-panel').getByRole('button', { name: '+2 дня' }).click()
  await expect(page.getByTestId('demo-panel').getByRole('status')).toContainText('Время платформы')
  await page.getByTestId('demo-panel').getByRole('button', { name: /Айгерим/ }).click()
  await expect(page.locator('.sidebar-role')).toContainText('Сотрудник')
  await page.goto('/requests')
  await expect(page.locator('.request-table .request-status').filter({ hasText: 'Передано HR' }).first()).toBeVisible()
})

test('375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAs(page, 'aigerim', '/dashboard')
  await page.getByRole('button', { name: 'Демо-панель' }).click()
  await expect(page.getByTestId('demo-panel')).toBeVisible()
  await noOverflow(page)
  await shot(page, 'demo-panel-375')
})
