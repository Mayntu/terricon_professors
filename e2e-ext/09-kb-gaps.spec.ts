import { expect, test } from '@playwright/test'
import { loginAs, noOverflow, resetDemo, shot } from './helpers'

test.beforeEach(async ({ page }) => { await resetDemo(page) })

test('пробелы базы: 23 вопроса → черновик → правка → публикация → AI отвечает', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr/knowledge')
  const first = page.getByTestId('kb-gaps').locator('li[data-gap]').first()
  await expect(first).toContainText('Вопросов: 23')
  await expect(page.locator('body')).not.toContainText('emp-')
  await shot(page, 'hr-kb-gaps-1440')
  await first.getByRole('button', { name: 'Подготовить черновик' }).click()
  const editor = page.getByTestId('kb-editor')
  await editor.getByLabel('Название правила').fill('Оплата ночных смен')
  await editor.getByLabel(/Текст правила/).fill('## Оплата ночных смен\nНочные смены оплачиваются с доплатой 50% к ставке за смену.')
  await expect(editor).toContainText('доплатой 50%')
  await shot(page, 'hr-kb-editor-1440')
  await editor.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(editor.getByRole('status')).toContainText('Опубликовано')

  await loginAs(page, 'aigerim', '/ai-jana')
  await page.getByPlaceholder('Например').fill('Как оплачиваются ночные смены?')
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  await expect(page.getByTestId('ai-answer').last()).toContainText('Внутреннее правило')
})

test('375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await loginAs(page, 'daniyar', '/hr/knowledge')
  await expect(page.getByTestId('kb-gaps')).toBeVisible()
  await noOverflow(page)
  await shot(page, 'hr-kb-gaps-375')
})
