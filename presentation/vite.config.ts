import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No imports from the HR app, no API proxy, no parent .env.
export default defineConfig({
  plugins: [react()],
  base: './',
  envDir: './config',
  build: { outDir: 'dist', emptyOutDir: true },
})
