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
  server: {
    // Tüm arayüzlerde dinle (yalnızca 127.0.0.1/::1 değil). Reverse proxy (Caddy)
    // dev sunucusuna `host.docker.internal:5173` ile container'dan ulaşır; loopback'e
    // bağlı bir Vite bu bağlantıyı kabul etmez (→ https://test.uniclub.test 502).
    // Backend'in dev sunucusu da (bun) 0.0.0.0 dinler; bu onunla aynı davranış.
    // NOT: Bu, dev sunucusunu LAN'a açar — paylaşımlı/okul ağında Windows güvenlik
    // duvarını yalnızca ÖZEL ağ için ver.
    host: true,
    // Proxy üzerinden gelen istekte Host başlığı `test.uniclub.test` olur; Vite
    // tanımadığı host'ları güvenlik için reddeder. `.uniclub.test` alt alanlarına izin ver.
    allowedHosts: ['.uniclub.test'],
  },
})
