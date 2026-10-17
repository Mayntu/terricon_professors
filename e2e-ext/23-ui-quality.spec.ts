import { appendFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { loginAs, resetDemo } from './helpers'

/** §7: все экраны на 1440 и 375 px — без горизонтальной прокрутки, без ключей i18n/undefined/NaN, без ошибок консоли. */
const ROUTES: Record<string, string[]> = {
  aigerim: ['/dashboard', '/profile', '/requests', '/requests/new/leave', '/notifications', '/academy', '/academy/course-safety', '/academy/course-returns/result', '/ai-jana', '/wage', '/grievances', '/shifts'],
  erlan: ['/dashboard', '/manager/approvals', '/manager/team', '/employees/emp-aigerim', '/employees/emp-asel', '/manager/learning', '/manager/xray', '/shifts'],
  daniyar: ['/hr', '/hr/requests', '/hr/employees', '/hr/inbox', '/hr/learning', '/hr/knowledge', '/hr/policies', '/employees/emp-bakyt'],
  bakyt: ['/dashboard', '/wage', '/profile'],
}
const BAD = /\bundefined\b|\bNaN\b|\bnull\b|Invalid Date|\[object Object\]|\{[a-z]+\}|\b(?:ext|common|ac|ai|gr|kb|sh|pp|g|w|hr|xr|p|demo|doc|lad)\.[a-zA-Z][\w.]*\b/

for (const width of [1440, 375]) {
  test(`все экраны @${width}px`, async ({ page }) => {
    test.setTimeout(240_000)
    await resetDemo(page)
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 })
    const problems: string[] = []
    page.on('console', (m) => {
      // Эта страница специально проверяет отказ в доступе к чужому сотруднику.
      if (m.location().url.endsWith('/api/employees/emp-asel') && m.text().includes('403')) return
      if (m.type() === 'error') problems.push(`console ${page.url()}: ${m.text().slice(0, 200)}`)
    })
    page.on('pageerror', (e) => problems.push(`pageerror ${page.url()}: ${e.message}`))
    for (const [login, routes] of Object.entries(ROUTES)) {
      await loginAs(page, login, routes[0])
      for (const r of routes) {
        await page.goto(r)
        await expect(page.locator('.app-shell')).toBeVisible()
        await expect(page.locator('.route-loading')).toHaveCount(0)
        if (login === 'erlan' && r === '/employees/emp-asel') await expect(page.getByTestId('employee-forbidden')).toBeVisible()
        await expect(page.locator('.query-loading')).toHaveCount(0, { timeout: 10_000 })
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        if (overflow > 1) problems.push(`overflow ${width} ${login} ${r}: +${overflow}px`)
        const text = await page.locator('body').innerText()
        const m = text.match(BAD)
        if (m) problems.push(`text ${login} ${r}: «${m[0]}»`)
        const money = text.match(/\d{4,}\s?₸|\d{1,3},\d{3}\s?₸/)
        if (money) problems.push(`money ${login} ${r}: «${money[0]}»`)
      }
    }
    if (process.env.QA_OUT) appendFileSync(process.env.QA_OUT, JSON.stringify({ width, problems }) + '\n')
    expect(problems).toEqual([])
  })
}

test('казахский: в моих словарях переведены все ключи', async ({ page }) => {
  await loginAs(page, 'aigerim', '/dashboard')
  const missing = await page.evaluate(async () => {
    const mod = await import('/src/modules/ext-core/i18n.ts')
    await import('/src/modules/index.ts')
    for (const p of ['/src/modules/ext-demo/DemoPanel.tsx', '/src/modules/ext-documents/DocumentBadge.tsx', '/src/modules/ext-ladder/LadderSection.tsx']) await import(p)
    return (mod as unknown as { missingKk?: () => string[] }).missingKk?.() ?? null
  })
  expect(missing).toEqual([])
})
