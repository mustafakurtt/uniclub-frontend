import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // `@/` → src/ (tsconfig.app.json'daki paths ile eş olmalı)
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
