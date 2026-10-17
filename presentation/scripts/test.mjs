// Own the two child processes directly. Avoid Windows shell grandchildren that
// can keep Playwright's webServer teardown waiting after a completed suite.
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'

await new Promise((ok, reject) => {
  const probe = createServer()
  probe.once('error', reject)
  probe.listen(5182, '127.0.0.1', () => probe.close(ok))
})
const production = process.env.PITCH_BUILD === '1'
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), ...(production ? ['preview'] : []), '--host', '127.0.0.1', '--port', '5182', '--strictPort'], { stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true })
let runner
const stop = () => { runner?.kill(); server.kill() }
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
try {
  await new Promise((ok, reject) => {
    const timeout = setTimeout(() => reject(new Error('Presentation test server did not start')), 20000)
    server.stdout.on('data', data => {
      process.stdout.write(data)
      if (data.toString().includes('http://127.0.0.1:5182')) { clearTimeout(timeout); ok() }
    })
    server.once('error', error => { clearTimeout(timeout); reject(error) })
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Test server stopped: ${code}`)) })
  })
  runner = spawn(process.execPath, [resolve('node_modules/@playwright/test/cli.js'), 'test', ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true, env: { ...process.env, PITCH_EXTERNAL_SERVER: '1' } })
  process.exitCode = await new Promise((ok, reject) => { runner.once('error', reject); runner.once('exit', code => ok(code ?? 1)) })
} finally { stop() }
