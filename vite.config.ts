import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // В docker на macOS события файлов не доходят до контейнера — опрос включается переменной из docker-compose
  server: { watch: {
    usePolling: process.env.VITE_USE_POLLING === 'true',
    // Playwright сохраняет HTML-снимки в репозитории; они не должны перезагружать приложение.
    ignored: ['**/artifacts/**', '**/test-results/**', '**/playwright-report/**', '**/docs/screenshots/**', '**/backend/**'],
  } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
