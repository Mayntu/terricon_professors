import { expect, test } from '@playwright/test'
import { loginAs, noOverflow, resetDemo, shot } from './helpers'

test.beforeEach(async ({ page }) => { await resetDemo(page) })

test('биржа смен: Айгерим отдаёт смену, Асель берёт за одно нажатие', async ({ page }) => {
  await loginAs(page, 'aigerim', '/shifts')
  const first = page.getByTestId('shifts-mine').locator('li').first()
  await first.getByRole('button', { name: 'Отдать смену' }).click()
  await expect(page.getByTestId('shifts-mine').locator('li').first()).toContainText('Выставлена на биржу')
  await shot(page, 'shifts-mine-1440')

  await loginAs(page, 'asel', '/shifts')
  const offer = page.getByTestId('shifts-available').locator('li').filter({ hasText: 'Айгерим' }).first()
  await expect(offer.getByRole('button')).toContainText('+12 000 ₸')
  await shot(page, 'shifts-available-1440')
  await offer.getByRole('button').click()
  await expect(page.getByTestId('shifts-available').locator('li').filter({ hasText: 'Айгерим' })).toHaveCount(0)

  await loginAs(page, 'erlan', '/shifts')
  await expect(page.getByTestId('shifts-team')).toContainText('Асель')
  await shot(page, 'shifts-manager-1440')
})

test('375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAs(page, 'aigerim', '/shifts')
  await expect(page.getByTestId('shifts-mine')).toBeVisible()
  await noOverflow(page)
  await shot(page, 'shifts-375')
})
