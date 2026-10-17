import { expect, test } from '@playwright/test'
import { loginAs, noOverflow, resetDemo, shot } from './helpers'

/** Скриншоты 375 px для экранов, у которых в своих спеках только десктоп. */
test.beforeEach(async ({ page }) => { await resetDemo(page); await page.setViewportSize({ width: 375, height: 812 }) })

const screens: [string, string, string][] = [
  ['aigerim', '/academy', 'academy-course-375'],
  ['aigerim', '/notifications', 'notifications-375'],
  ['erlan', '/manager/xray', 'manager-xray-375'],
  ['erlan', '/manager/learning', 'manager-learning-375'],
  ['daniyar', '/hr/inbox', 'hr-inbox-375'],
  ['daniyar', '/hr/learning', 'hr-learning-375'],
]

for (const [login, path, name] of screens) {
  test(`${name}`, async ({ page }) => {
    await loginAs(page, login, path)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.query-loading')).toHaveCount(0)
    await noOverflow(page)
    await shot(page, name)
  })
}
