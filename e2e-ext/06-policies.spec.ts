import { expect, test } from '@playwright/test'
import { loginAs, noOverflow, resetDemo, shot } from './helpers'

test.beforeEach(async ({ page }) => { await resetDemo(page) })

test('Политики: KZ/KG, правка срока, запрет автоодобрения денег', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr/policies')
  const vacation = page.locator('.ext-policy[data-type="vacation"]')
  await expect(vacation.getByLabel('Срок ответа, ч')).toHaveValue('48')
  await shot(page, 'hr-policies-1440')
  await vacation.getByLabel('Срок ответа, ч').fill('24')
  await vacation.getByRole('button', { name: 'Сохранить' }).click()
  await expect(vacation.getByRole('status')).toHaveText('Сохранено')
  const wage = page.locator('.ext-policy[data-type="wage_access"]')
  await expect(wage.locator('option[value="auto_approve"]')).toHaveCount(0)
  await expect(vacation.getByLabel('По истечении срока')).toHaveValue('escalate_hr')
  await page.getByRole('radio', { name: 'KG' }).check({ force: true })
  await expect(page.locator('.ext-policy[data-type="vacation"]').getByLabel('Срок ответа, ч')).toHaveValue('72')
  await expect(page.locator('.ext-policy[data-type="wage_access"]').getByLabel('Лимит, %')).toHaveValue('40')
})

test('Политики 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAs(page, 'daniyar', '/hr/policies')
  await expect(page.getByTestId('policies')).toBeVisible()
  await noOverflow(page)
  await shot(page, 'hr-policies-375')
})
