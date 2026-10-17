import { expect, test, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import '../src/scenes/outro/config'

const errors = new WeakMap<Page, string[]>()
test.beforeEach(({ page }) => {
  const messages: string[] = []
  errors.set(page, messages)
  page.on('pageerror', e => messages.push(e.message))
  page.on('console', m => { if (m.type() === 'error') messages.push(m.text()) })
  page.on('response', r => { if (r.status() >= 400) messages.push(`${r.status()} ${r.url()}`) })
})
test.afterEach(({ page }) => { expect(errors.get(page)).toEqual([]) })
async function ready(page: Page) {
  await expect(page.locator('.cinema')).toHaveAttribute('data-ready', 'true')
  await page.waitForFunction(() => !!window.__JANA_OUTRO__)
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(img => img.decode())) })
}
async function seek(page: Page, time: number) {
  await page.evaluate(t => window.__JANA_OUTRO__!.seek(t), time)
  await expect(page.locator('.film-canvas')).toHaveAttribute('data-time', time.toFixed(3))
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
}
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex')

test('same frame after backward seeking, replay and a fresh renderer', async ({ page, context }, info) => {
  await page.goto('/?render=outro')
  await ready(page)
  expect(await page.evaluate(() => window.__JANA_OUTRO__!.duration)).toBe(30)
  for (const time of [2.5, 7.3, 12.4, 18.8, 23.8, 29.967]) {
    await seek(page, time)
    const before = await page.screenshot()
    await seek(page, 30)
    await seek(page, 0)
    await seek(page, time)
    const after = await page.screenshot()
    if (hash(before) !== hash(after)) {
      await info.attach(`before-${time}`, { body: before, contentType: 'image/png' })
      await info.attach(`after-${time}`, { body: after, contentType: 'image/png' })
    }
    expect(hash(after), `Repeated frame at ${time}s`).toBe(hash(before))
  }
  const fresh = await context.newPage()
  await fresh.goto('/?render=outro')
  await ready(fresh)
  await seek(fresh, 12.4)
  await seek(page, 12.4)
  expect(hash(await fresh.screenshot())).toBe(hash(await page.screenshot()))
  await fresh.close()
})

test('decision changes the route only after confirmation; real course and source appear', async ({ page }) => {
  await page.goto('/?render=outro')
  await ready(page)
  await seek(page, 12.4)
  await expect(page.locator('.film-manager-screen')).toBeVisible()
  await expect(page.locator('.film-approved-stamp')).not.toBeVisible()
  await expect(page.locator('.result-check')).not.toBeVisible()
  await expect(page.locator('.film-flow-active')).toHaveCSS('stroke', 'rgb(228, 226, 216)')
  await seek(page, 14.4)
  await expect(page.locator('.film-approved-stamp')).toBeVisible()
  await expect(page.locator('.result-check')).toBeVisible()
  await expect(page.locator('.result-wait')).not.toBeVisible()
  await expect(page.locator('.film-flow-active')).toHaveCSS('stroke', 'rgb(143, 207, 169)')
  await seek(page, 16.9)
  await expect(page.locator('.film-course-result')).toBeVisible()
  await expect(page.locator('.film-course-result')).toContainText('100%')
  await seek(page, 18.9)
  await expect(page.locator('.film-source-card')).toBeVisible()
  await expect(page.locator('.film-source-card img')).toHaveAttribute('src', /ai-source\.png$/)
  await seek(page, 30)
  await expect(page.locator('.film-end-authors')).toContainText('Бондарев Владислав')
  await expect(page.locator('.film-end-authors')).toContainText('Хуснуллил Даниил')
})

for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768]]) {
  test(`film fits ${width}×${height}, reduced motion holds final frame`, async ({ page }) => {
    await page.setViewportSize({ width: width!, height: height! })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#outro')
    await ready(page)
    await expect(page.locator('.film-canvas')).toHaveAttribute('data-time', '30.000')
    await expect(page.locator('.cinema')).toHaveAttribute('data-playing', 'false')
    await expect(page.locator('.film-play')).toBeDisabled()
    const layout = await page.evaluate(() => {
      const bounds = document.querySelector('.film-frame')!.getBoundingClientRect()
      const cropped = Array.from(document.querySelectorAll('.film-end-card h1, .film-end-card p, .film-end-authors, .film-end-kicker')).filter(el => { const box = el.getBoundingClientRect(); return box.left < bounds.left || box.top < bounds.top || box.right > bounds.right || box.bottom > bounds.bottom }).length
      return { cropped, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, ratio: bounds.width / bounds.height }
    })
    expect(layout).toMatchObject({ cropped: 0, width, height })
    expect(layout.ratio).toBeCloseTo(16 / 9, 3)
    const frame = hash(await page.locator('.film-frame').screenshot())
    await page.keyboard.press('KeyR')
    expect(hash(await page.locator('.film-frame').screenshot())).toBe(frame)
    await page.screenshot({ path: `artifacts/screenshots/${width}x${height}-outro.png` })
  })
}

test('slide three opens the movie, keyboard playback and return clean up', async ({ page }) => {
  await page.goto('/#slide-3')
  const launch = page.getByRole('button', { name: 'Смотреть финальный ролик', exact: true })
  await launch.click()
  await ready(page)
  await expect(page).toHaveURL(/#outro$/)
  await expect(page.locator('.cinema')).toBeFocused()
  await expect(page.locator('.controls')).toHaveAttribute('inert', '')
  await page.keyboard.press('Space')
  await expect(page.locator('.cinema')).toHaveAttribute('data-playing', 'false')
  const paused = await page.evaluate(() => window.__JANA_OUTRO__!.time())
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.__JANA_OUTRO__!.time())).toBe(paused)
  await seek(page, 18)
  await page.keyboard.press('KeyR')
  await expect(page.locator('.cinema')).toHaveAttribute('data-playing', 'true')
  expect(await page.evaluate(() => window.__JANA_OUTRO__!.time())).toBeLessThan(2)
  await page.keyboard.press('KeyF')
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  await page.keyboard.press('KeyF')
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.cinema')).toHaveCount(0)
  expect(await page.evaluate(() => !!window.__JANA_OUTRO__)).toBe(false)
  await expect(page).toHaveURL(/#slide-3$/)
  await expect(launch).toBeFocused()
  // A focused native button retains its Space activation; no duplicate global handler.
  await page.keyboard.press('Space')
  await ready(page)
  await page.getByRole('button', { name: '← К слайдам' }).focus()
  await page.keyboard.press('Space')
  await expect(page.locator('.cinema')).toHaveCount(0)
})

test('30-second realtime playback reaches and holds its ending', async ({ page }) => {
  await page.goto('/#outro')
  await ready(page)
  await expect(page.locator('.cinema')).toHaveAttribute('data-playing', 'false', { timeout: 34000 })
  await expect(page.locator('.film-canvas')).toHaveAttribute('data-time', '30.000')
  await expect(page.locator('.film-play')).toHaveText('Повтор')
  const frame = hash(await page.locator('.film-frame').screenshot())
  await page.waitForTimeout(250)
  expect(hash(await page.locator('.film-frame').screenshot())).toBe(frame)
})

test('loaded film plays offline with no backend or external asset requests', async ({ page, context }) => {
  test.skip(process.env.PITCH_BUILD !== '1', 'Production build required for offline checks')
  const external: string[] = []
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5182/') && !request.url().startsWith('data:')) external.push(request.url()) })
  await page.goto('/#outro')
  await ready(page)
  await context.setOffline(true)
  for (const time of [2.5, 7.3, 12.4, 18.8, 23.8, 30]) await seek(page, time)
  await expect(page.locator('.film-end-card h1')).toBeVisible()
  expect(external).toEqual([])
  await context.setOffline(false)
})
