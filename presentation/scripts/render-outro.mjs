import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { once } from 'node:events'
import { createServer } from 'node:net'

// Deterministic frame export, not screen recording: frame n is sought to n / 30.
const fps = 30
const frames = 900
const output = resolve('output')
const stillsOnly = process.argv.includes('--stills')
await mkdir(`${output}/storyboard`, { recursive: true })
if (!existsSync('dist/index.html')) throw new Error('Build first: npm run build')
let ffmpeg = process.env.FFMPEG_PATH
if (!ffmpeg && !stillsOnly) {
  const bin = '.tools/imageio_ffmpeg/binaries'
  const file = (await readdir(bin).catch(() => [])).find(name => name.startsWith('ffmpeg-') && name.endsWith('.exe'))
  ffmpeg = file ? resolve(bin, file) : 'ffmpeg'
}
await new Promise((ok, reject) => { const probe = createServer(); probe.once('error', reject); probe.listen(5184, '127.0.0.1', () => probe.close(ok)) })
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '5184', '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true })
let browser, encoder
let encodeError = ''
const browserErrors = []
const started = Date.now()
try {
  await new Promise((ok, reject) => {
    const timeout = setTimeout(() => reject(new Error('Render server startup timeout')), 20000)
    server.stdout.on('data', chunk => { if (chunk.toString().includes('http://127.0.0.1:5184')) { clearTimeout(timeout); ok() } })
    server.once('error', e => { clearTimeout(timeout); reject(e) })
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Render server exited ${code}`)) })
  })
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome', args: ['--force-color-profile=srgb'] })
  const pages = await Promise.all(Array.from({ length: stillsOnly ? 1 : 3 }, async () => {
    const p = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' })
    p.on('pageerror', e => browserErrors.push(e.message))
    p.on('console', m => { if (m.type() === 'error') browserErrors.push(m.text()) })
    await p.goto('http://127.0.0.1:5184/?render=outro')
    await p.waitForFunction(() => !!window.__JANA_OUTRO__)
    await p.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images).map(image => image.decode())) })
    return p
  }))
  async function screenshot(page, t) {
    await page.evaluate(seconds => { window.__JANA_OUTRO__.seek(seconds); document.querySelector('.film-canvas').getBoundingClientRect() }, t)
    // Let layout and the compositor commit the sought SVG/3D transforms.
    await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(() => ok()))))
    return page.screenshot({ type: 'png', animations: 'allow', caret: 'hide' })
  }
  const checkpoints = [0, 2.5, 5.8, 7.3, 8.4, 9.7, 10.4, 12.4, 14.4, 16.7, 18.8, 21.5, 23.8, 26.5, 899 / 30]
  for (const t of checkpoints) await writeFile(`${output}/storyboard/${t.toFixed(3).padStart(6, '0')}.png`, await screenshot(pages[0], t))
  console.log(`Saved ${checkpoints.length} exact-time storyboard frames.`)
  if (!stillsOnly) {
    const file = `${output}/jana-from-request-to-result.mp4`
    encoder = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'warning', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'png', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-threads', '4', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-r', String(fps), '-frames:v', String(frames), '-movflags', '+faststart', file], { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true })
    encoder.stderr.on('data', data => { encodeError += data.toString() })
    const encoded = new Promise((ok, reject) => { encoder.once('error', reject); encoder.once('close', code => code === 0 ? ok() : reject(new Error(`FFmpeg exited ${code}: ${encodeError}`))) })
    // Register failures immediately, including a missing executable, without unhandled rejections.
    let failed
    encoded.catch(error => { failed = error })
    encoder.stdin.on('error', error => { failed = error })
    for (let start = 0; start < frames; start += pages.length) {
      if (failed) throw failed
      const images = await Promise.all(pages.map((p, offset) => screenshot(p, (start + offset) / fps)))
      for (const buffer of images) {
        if (failed) throw failed
        if (!encoder.stdin.write(buffer)) await once(encoder.stdin, 'drain')
      }
      if (start % 90 === 0) console.log(`Rendered ${start + pages.length}/${frames} frames (${((start + pages.length) / fps).toFixed(1)} s / 30 s).`)
    }
    encoder.stdin.end()
    await encoded
    if (browserErrors.length) throw new Error(browserErrors.join('\n'))
    await writeFile(`${output}/render-report.json`, JSON.stringify({ video: 'jana-from-request-to-result.mp4', width: 1920, height: 1080, fps, frames, durationSeconds: 30, codec: 'H.264', pixelFormat: 'yuv420p', audio: 'none', renderedAt: new Date().toISOString(), method: 'GSAP total time = frame / 30; paused timeline; Playwright PNG frames streamed in order to FFmpeg, no realtime screen recording', workers: pages.length, elapsedSeconds: Math.round((Date.now() - started) / 1000), browserErrors, checkpoints }, null, 2))
    console.log(`MP4 ready: ${file}`)
  }
} finally { encoder?.kill(); await browser?.close(); server.kill() }
