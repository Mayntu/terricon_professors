// Opt-in capture from the already isolated QA demo. Never resets or decides a request.
import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const web = process.env.CAPTURE_WEB_URL ?? 'http://localhost:15173'
const api = process.env.CAPTURE_API_URL ?? 'http://localhost:18000'
const target = resolve('public/assets/product')
await mkdir(target, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const records = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'ru-RU' })
  const page = await context.newPage()
  async function login(login) {
    const response = await page.request.post(`${api}/api/demo/login-as`, { data: { login } })
    if (!response.ok()) throw new Error(`Demo login unavailable: ${response.status()}`)
    const { accessToken, user } = await response.json()
    await page.goto(`${web}/login`)
    await page.evaluate(({ token, role }) => {
      sessionStorage.setItem('jana.api-token.v1', token)
      sessionStorage.setItem('jana.demo-role.v1', role)
      localStorage.setItem('jana.lang.v1', 'ru')
    }, { token: accessToken, role: user.role })
    return accessToken
  }
  async function shot(file, path, selector = '.route-frame[data-present="true"]') {
    await page.goto(`${web}${path}`)
    await page.locator('.app-shell').waitFor()
    await expect(page.locator('.route-frame[data-present="true"] h1')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.route-frame[data-present="true"]')).not.toContainText('Открываем раздел')
    if (path === '/academy') await page.locator('a[href*="/academy/"]').first().waitFor()
    if (path.startsWith('/requests/')) await page.locator('.jana-flow-map').waitFor()
    if (path === '/dashboard') await page.getByRole('heading', { name: /Айгерим/ }).first().waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: '.notification-signal, .ext-demo-fab, .ext-demo-panel { display: none !important; }' })
    await page.waitForTimeout(800)
    const el = page.locator(selector).first()
    await el.screenshot({ path: `${target}/${file}.png` })
    records.push({ file: `${file}.png`, route: path, selector, capturedAt: new Date().toISOString() })
  }
  const token = await login('aigerim')
  const response = await page.request.get(`${api}/api/leave/my`, { headers: { Authorization: `Bearer ${token}` } })
  const { items } = await response.json()
  const leave = items.find(r => r.status === 'Submitted') ?? items[0]
  if (!leave) throw new Error('Capture requires an existing demo leave; no records created automatically.')
  await shot('dashboard', '/dashboard', '.app-shell')
  await shot('leave-request', `/requests/${leave.id}`)
  await shot('flow-map', `/requests/${leave.id}`, '.jana-flow-map')
  await shot('academy', '/academy')
  await page.goto(`${web}/ai-jana`)
  await page.getByPlaceholder('Например').fill('Сколько дней отпуска положено?')
  await page.getByRole('button', { name: 'Спросить', exact: true }).click()
  await page.getByTestId('ai-answer').waitFor()
  await page.locator('.ext-sources').waitFor()
  await expect(page.getByTestId('ai-answer')).toContainText('24 календарных дня')
  await page.addStyleTag({ content: '.notification-signal, .ext-demo-fab, .ext-demo-panel { display: none !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.route-frame[data-present="true"]').screenshot({ path: `${target}/ai-jana.png` })
  records.push({ file: 'ai-jana.png', route: '/ai-jana', question: 'Сколько дней отпуска положено?', capturedAt: new Date().toISOString() })
  await login('erlan')
  await shot('manager-decision', `/requests/${leave.id}`, '.decision-panel')
  const managerToken = await page.evaluate(() => sessionStorage.getItem('jana.api-token.v1'))
  const teamResponse = await page.request.get(`${api}/api/requests/inbox?pending=false`, { headers: { Authorization: `Bearer ${managerToken}` } })
  if (teamResponse.ok()) {
    const team = await teamResponse.json()
    const approved = team.items?.find(r => r.type === 'vacation' && r.status === 'Approved')
    if (approved) await shot('approved', `/requests/${approved.id}`)
  }
  // Existing approved record from the separately prepared normal-auth QA stand.
  // No decision is sent by this script. The two screenshots intentionally show different records.
  const normalWeb = process.env.CAPTURE_NORMAL_WEB_URL ?? 'http://localhost:15174'
  const normalApi = process.env.CAPTURE_NORMAL_API_URL ?? 'http://localhost:18001'
  const auth = await page.request.post(`${normalApi}/api/auth/login`, { data: { login: 'aigerim', password: 'demo1234' } })
  if (!auth.ok()) throw new Error('Normal QA login unavailable; existing assets remain usable.')
  const normal = await auth.json()
  const mine = await page.request.get(`${normalApi}/api/leave/my`, { headers: { Authorization: `Bearer ${normal.accessToken}` } })
  const approved = (await mine.json()).items.find(r => r.status === 'Approved')
  if (!approved) throw new Error('Normal QA has no already approved leave. No approval performed.')
  await page.goto(`${normalWeb}/login`)
  await page.evaluate(({ token, role }) => {
    sessionStorage.setItem('jana.api-token.v1', token)
    sessionStorage.setItem('jana.demo-role.v1', role)
    localStorage.setItem('jana.lang.v1', 'ru')
  }, { token: normal.accessToken, role: normal.user.role })
  await page.goto(`${normalWeb}/requests/${approved.id}`)
  await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Approved', { timeout: 30000 })
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: '.notification-signal { display: none !important; }' })
  await page.locator('.jana-flow-map').screenshot({ path: `${target}/approved.png` })
  records.push({ file: 'approved.png', route: `/requests/${approved.id}`, selector: '.jana-flow-map', source: normalWeb, capturedAt: new Date().toISOString() })
  await writeFile(`${target}/provenance.json`, JSON.stringify({ source: 'Running JanaМен React + FastAPI QA demo; fictitious employees. Only transient toast and demo controls hidden for screenshots. No content edited.', web, api, records }, null, 2))
  console.log(`Captured ${records.length} actual screens. No reset, leave creation or decision performed.`)
} finally { await browser.close() }
