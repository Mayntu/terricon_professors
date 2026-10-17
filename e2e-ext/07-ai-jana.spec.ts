import { expect, test } from '@playwright/test'
import { loginAs, noOverflow, resetDemo, shot } from './helpers'

test.beforeEach(async ({ page }) => { await resetDemo(page) })

async function ask(page: import('@playwright/test').Page, q: string) {
  await page.getByPlaceholder('Например').fill(q)
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  return page.getByTestId('ai-answer').last()
}

test('AI Jana: источник KZ, отказ на чужие данные, «нет информации» → «Спросить HR»', async ({ page }) => {
  await loginAs(page, 'aigerim', '/ai-jana')
  let a = await ask(page, 'Сколько дней отпуска положено?')
  await expect(a).toContainText('24 календарных дня')
  await expect(a).toContainText('ТК РК')
  a = await ask(page, 'Какая зарплата у моего начальника?')
  await expect(a).toContainText('Защита данных')
  a = await ask(page, 'Как оплачиваются ночные смены?')
  await expect(a).toContainText('Надёжной информации')
  await a.getByRole('button', { name: 'Спросить HR' }).click()
  await expect(a.getByRole('status')).toContainText('Вопрос передан в HR — HQ-')
  await shot(page, 'ai-jana-1440')
  await page.getByTestId('ai-answer').first().getByRole('link').first().click()
  await expect(page.getByTestId('source-body')).toContainText('24 календарных дня')
  await shot(page, 'ai-source-1440')
})

test('тот же вопрос от Бакыта — источник KG', async ({ page }) => {
  await loginAs(page, 'bakyt', '/ai-jana')
  const a = await ask(page, 'Сколько дней отпуска положено?')
  await expect(a).toContainText('28 календарных дней')
  await expect(a).toContainText('ТК КР')
})

test('AI Jana 375 px и казахский', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAs(page, 'aigerim', '/ai-jana')
  await page.getByRole('radio', { name: 'KZ' }).check({ force: true })
  await page.getByRole('button', { name: 'Демалыс қанша күн?' }).click()
  await expect(page.getByTestId('ai-answer').last()).toContainText('24')
  await noOverflow(page)
  await shot(page, 'ai-jana-375-kk')
})
