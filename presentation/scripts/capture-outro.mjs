import { chromium, expect as baseExpect } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Explicitly isolated QA ports. Never uses the user's primary :5173/:8000 database.
const web = 'http://localhost:15173'
const api = 'http://localhost:18000'
const target = 'public/assets/outro'
await mkdir(target, { recursive: true })
const expect = baseExpect.configure({ timeout: 30000 })
const browser = await chromium.launch({ channel: 'chrome' })
const records = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'ru-RU' })
  async function login(login) {
    const response = await page.request.post(`${api}/api/demo/login-as`, { data: { login } })
    if (!response.ok()) throw new Error('Isolated demo API unavailable')
    const { accessToken, user } = await response.json()
    await page.goto(`${web}/login`)
    await page.evaluate(({ token, role }) => {
      sessionStorage.setItem('jana.api-token.v1', token)
      sessionStorage.setItem('jana.demo-role.v1', role)
      localStorage.setItem('jana.lang.v1', 'ru')
    }, { token: accessToken, role: user.role })
    return { Authorization: `Bearer ${accessToken}` }
  }
  async function shot(name, selector) {
    await page.evaluate(() => document.fonts.ready)
    await page.addStyleTag({ content: '.notification-signal,.ext-demo-fab,.ext-demo-panel,.creation-confirmation{display:none!important}' })
    await page.waitForTimeout(200)
    const node = page.locator(selector).first()
    await node.screenshot({ path: `${target}/${name}.png` })
    records.push({ file: `${name}.png`, url: page.url(), selector, capturedAt: new Date().toISOString() })
  }
  const headers = await login('aigerim')
  if (process.argv.includes('--source-only')) {
    await page.goto(`${web}/knowledge/kb-kz-vacation#section-1`)
    await expect(page.getByTestId('source-body')).toContainText('24 календарных дня')
    await shot('ai-source', '.route-frame[data-present="true"]')
    const provenance = JSON.parse(await readFile(`${target}/provenance.json`, 'utf8'))
    provenance.records = provenance.records.map(record => record.file === 'ai-source.png' ? records[0] : record)
    provenance.recordedAt = records[0].capturedAt
    await writeFile(`${target}/provenance.json`, JSON.stringify(provenance, null, 2))
    console.log('Recaptured source after its actual article loaded; no data changed.')
    await browser.close()
    process.exit(0)
  }
  const mine = await (await page.request.get(`${api}/api/leave/my`, { headers })).json()
  let day = new Date(Date.now() + 300 * 86400000)
  while (mine.items.some(r => ['Submitted', 'Escalated', 'Approved'].includes(r.status) && r.startDate <= new Date(day.getTime() + 86400000).toISOString().slice(0, 10) && r.endDate >= day.toISOString().slice(0, 10))) day = new Date(day.getTime() + 4 * 86400000)
  const start = day.toISOString().slice(0, 10)
  const end = new Date(day.getTime() + 86400000).toISOString().slice(0, 10)
  await page.goto(`${web}/requests/new/leave`)
  await expect(page.getByLabel('Первый день', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Проверить заявку' })).toBeEnabled()
  await shot('leave-empty', '.business-page')
  await page.getByLabel('Первый день', { exact: true }).fill(start)
  await page.getByLabel('Последний день', { exact: true }).fill(end)
  await shot('leave-filled', '.business-page')
  await page.getByRole('button', { name: 'Проверить заявку' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await shot('leave-confirm', 'dialog')
  await page.getByRole('dialog').getByRole('button', { name: 'Отправить заявку', exact: true }).click()
  await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Submitted')
  const requestId = new URL(page.url()).pathname.split('/').at(-1)
  await shot('flow-submitted', '.jana-flow-map')
  await login('erlan')
  await page.goto(`${web}/requests/${requestId}`)
  await expect(page.locator('.decision-panel')).toBeVisible()
  await shot('manager-confirm', '.decision-panel')
  await page.getByRole('button', { name: 'Подтвердить согласование', exact: true }).click()
  await expect(page.locator('.jana-flow-map')).toHaveAttribute('data-status', 'Approved')
  await shot('flow-approved', '.jana-flow-map')
  await login('aigerim')
  await page.goto(`${web}/academy/course-safety/result`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('main')).toContainText('100')
  await shot('academy-completed', '.route-frame[data-present="true"]')
  await page.goto(`${web}/ai-jana`)
  await page.getByRole('button', { name: 'Сколько дней отпуска положено?', exact: true }).click()
  await expect(page.getByTestId('ai-answer')).toContainText('24 календарных дня')
  await shot('ai-answer', '[data-testid="ai-answer"]')
  await page.locator('.ext-sources a').first().click()
  await expect(page).toHaveURL(/knowledge\/kb-kz-vacation/)
  await expect(page.getByTestId('source-body')).toContainText('24 календарных дня')
  await shot('ai-source', '.route-frame[data-present="true"]')
  await writeFile(`${target}/provenance.json`, JSON.stringify({ recordedAt: new Date().toISOString(), source: 'Isolated QA React/FastAPI/PostgreSQL; fictitious employees only', web, api, requestId, dates: { start, end }, workflow: 'One real new two-day leave, submitted by aigerim and approved by erlan. No reset or time advance. Academy is a previously completed course. Original document, no translation.', records }, null, 2))
  console.log(`Captured ${records.length} real UI states for one submitted/approved QA leave; no reset.`)
} finally { await browser.close() }
