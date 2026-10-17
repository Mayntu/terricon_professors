import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await mkdir('artifacts/screenshots', { recursive: true })
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`) })
  await page.exposeFunction('qaErrors', () => errors)
})
test.afterEach(async ({ page }) => {
  if (!page.isClosed() && page.url() !== 'about:blank') {
    expect(await page.evaluate(async () => await (window as unknown as { qaErrors: () => Promise<string[]> }).qaErrors())).toEqual([])
  }
})

for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768]]) {
  test(`all chapters fit ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width: width!, height: height! })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    for (let n = 1; n <= 3; n++) {
      await page.getByRole('button', { name: new RegExp(`^Слайд ${n}:`) }).click()
      await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', String(n))
      await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'idle')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const bounds = await page.evaluate(() => {
        const stage = document.querySelector('.stage')!.getBoundingClientRect()
        const active = document.querySelector('.slide[aria-hidden="false"]')!
        const nodes = active.querySelectorAll('h1, .title-tagline, .authors, .problem-footnote, .solution-copy, .proof-points, .journey-node, .slide-footer')
        const clipped = Array.from(nodes).filter(el => { const b = el.getBoundingClientRect(); return b.left < stage.left - 1 || b.right > stage.right + 1 || b.top < stage.top - 1 || b.bottom > stage.bottom + 1 }).map(e => e.className)
        const masked = Array.from(active.querySelectorAll('.type-mask')).filter(el => { const b = el.getBoundingClientRect(); const text = el.firstElementChild!.getBoundingClientRect(); return text.right > b.right + 1 || text.bottom > b.bottom + 1 })
        return { clipped, masks: masked.length, width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, stage: { x: stage.x, y: stage.y, width: stage.width, height: stage.height } }
      })
      expect(bounds.clipped).toEqual([])
      expect(bounds.masks).toBe(0)
      expect(bounds.width).toBe(width)
      expect(bounds.height).toBe(height)
      expect(bounds.stage.x).toBeGreaterThanOrEqual(-1)
      expect(bounds.stage.y).toBeGreaterThanOrEqual(-1)
      expect(bounds.stage.width / bounds.stage.height).toBeCloseTo(16 / 9, 3)
      await page.screenshot({ path: `artifacts/screenshots/${width}x${height}-slide-${n}.png` })
    }
    await expect(page.getByRole('button', { name: 'Смотреть финальный ролик', exact: true })).toBeEnabled()
  })
}

test('keyboard, fullscreen, restart and rapid transitions clean up', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'entering')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', '2')
  await page.keyboard.press('Space')
  await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', '3')
  await page.keyboard.press('KeyR')
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'entering')
  await expect(page.locator('.product-frame-0')).toBeVisible()
  await page.keyboard.press('KeyF')
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true)
  await page.keyboard.press('Escape')
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false)
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('KeyR')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
  }
  // Advancing beyond slide three now intentionally opens the movie.
  if (await page.locator('.cinema').count()) await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('KeyR')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.presentation')).toHaveAttribute('data-busy', 'false')
  await page.getByRole('button', { name: /^Слайд 3:/ }).click()
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'idle')
  await expect(page.locator('.node-three')).toHaveCSS('opacity', '1')
  await expect(page.locator('.product-frame-4')).toBeVisible()
  await expect(page.locator('.product-frame-0')).not.toBeVisible()
  await page.getByRole('button', { name: /^Слайд 1:/ }).click()
  await expect(page.getByText('Бондарев Владислав', { exact: true })).toBeVisible()
  await expect(page.getByText('Хуснуллил Даниил', { exact: true })).toBeVisible()
})

test('seven real screens open, close and preserve presentation focus', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#slide-3')
  const gallery = page.getByRole('button', { name: /^Скриншот:/ })
  await expect(gallery).toHaveCount(7)
  for (let i = 0; i < 7; i++) {
    await gallery.nth(i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect.poll(() => dialog.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 500)).toBe(true)
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', '3')
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(gallery.nth(i)).toBeFocused()
  }
})

test('local assets only and offline navigation after load', async ({ page, context }) => {
  test.skip(process.env.PITCH_BUILD !== '1', 'Offline is verified against the production build, without the Vite HMR client.')
  const external: string[] = []
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:5182/') && !r.url().startsWith('data:')) external.push(r.url()) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect.poll(() => page.evaluate(() => Array.from(document.images).every(i => i.complete && i.naturalWidth > 0))).toBe(true)
  // Fonts in the other scenes are the same two locally bundled families.
  await page.getByRole('button', { name: /^Слайд 3:/ }).click()
  await page.getByRole('button', { name: /^Слайд 1:/ }).click()
  await context.setOffline(true)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', '2')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', '3')
  expect(external).toEqual([])
  await context.setOffline(false)
})

test('motion completes once and holds the final composition', async ({ page }) => {
  await page.goto('/#slide-3')
  await expect(page.locator('.product-frame-0')).toBeVisible()
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'idle', { timeout: 18000 })
  await expect(page.locator('.product-frame-4')).toBeVisible()
  await expect(page.locator('.node-three')).toHaveCSS('opacity', '1')
  const before = await page.locator('.product-frame-4').boundingBox()
  await page.waitForTimeout(500)
  expect(await page.locator('.product-frame-4').boundingBox()).toEqual(before)
  await page.screenshot({ path: 'artifacts/screenshots/motion-solution-final.png' })
  await page.getByRole('button', { name: /^Слайд 1:/ }).click()
  await expect(page.locator('.presentation')).toHaveAttribute('data-active-slide', '1')
  const frameTimes = await page.evaluate(() => new Promise<number[]>(resolve => {
    const intervals: number[] = []; let previous = performance.now()
    const sample = (now: number) => { intervals.push(now - previous); previous = now; if (intervals.length < 90) requestAnimationFrame(sample); else resolve(intervals.slice(1)) }
    requestAnimationFrame(sample)
  }))
  const sorted = frameTimes.toSorted((a, b) => a - b)
  await writeFile('artifacts/frame-timing.json', JSON.stringify({ environment: 'Headless Chrome, local diagnostic; not a cross-device FPS guarantee', samples: frameTimes.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * 0.95)], over50ms: frameTimes.filter(n => n > 50).length }, null, 2))
  await expect(page.locator('.stage')).toHaveAttribute('data-phase', 'idle')
})
