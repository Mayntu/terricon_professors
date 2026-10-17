import { expect, test, type Page } from '@playwright/test'
import { loginAs, resetDemo } from './helpers'

/** §8: HTML/скрипт, спецсимволы и очень длинный текст в полях — показываются как текст, не выполняются, не ломают вёрстку. */
const XSS = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script> "кавычки" & 'апостроф' ½ 😀 \\ % _`
const LONG = 'Оченьдлинноесловобезпробелов'.repeat(40)
test.beforeEach(async ({ page }) => { await resetDemo(page) })
async function safe(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  expect(await page.locator('main img[src="x"]').count()).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}

test('комментарий к отпуску → карточка руководителя', async ({ page }) => {
  await loginAs(page, 'asel', '/requests/new/leave')
  const day = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
  await page.getByLabel('Первый день', { exact: true }).fill(day(30))
  await page.getByLabel('Последний день', { exact: true }).fill(day(31))
  await page.getByLabel('Комментарий руководителю').fill(`${XSS} ${LONG}`.slice(0, 1000))
  await page.getByRole('button', { name: 'Проверить заявку' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Отправить заявку', exact: true }).click()
  await expect(page.locator('.creation-confirmation')).toBeVisible()
  await expect(page.locator('main')).toContainText('<script>')
  await safe(page)
  await loginAs(page, 'gulnara', '/manager/approvals')
  await page.locator('.request-number').first().click()
  await expect(page.locator('main')).toContainText('onerror')
  await safe(page)
})

test('обращение и вопрос AI → входящие HR', async ({ page }) => {
  await loginAs(page, 'aigerim', '/grievances')
  await page.getByLabel('Что произошло').fill(`${XSS} ${LONG}`)
  await page.getByRole('button', { name: 'Отправить обращение' }).click()
  await expect(page.getByTestId('grievances-mine')).toContainText('<script>')
  await safe(page)
  await page.goto('/ai-jana')
  await page.getByPlaceholder('Например').fill(`${XSS} ${LONG}`)
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  await expect(page.getByTestId('ai-answer').last()).toBeVisible()
  await safe(page)
  await loginAs(page, 'daniyar', '/hr/inbox')
  await expect(page.getByTestId('hr-inbox')).toContainText('<script>')
  await safe(page)
})

test('правило базы знаний с HTML показывается текстом и у сотрудника', async ({ page }) => {
  await loginAs(page, 'daniyar', '/hr/knowledge')
  await page.getByTestId('kb-gaps').locator('li[data-gap]').first().getByRole('button', { name: 'Подготовить черновик' }).click()
  const editor = page.getByTestId('kb-editor')
  await editor.getByLabel(/Текст правила/).fill(`## Оплата ночных смен\nНочные смены оплачиваются с доплатой 50%. ${XSS}`)
  await expect(editor).toContainText('<script>')
  await safe(page)
  await editor.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(editor.getByRole('status')).toContainText('Опубликовано')
  await loginAs(page, 'aigerim', '/ai-jana')
  await page.getByPlaceholder('Например').fill('Как оплачиваются ночные смены?')
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  await page.getByTestId('ai-answer').last().getByRole('link').first().click()
  await expect(page.getByTestId('source-body')).toContainText('<script>')
  await safe(page)
})
