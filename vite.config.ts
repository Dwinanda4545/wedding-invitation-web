import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiTarget =
  process.env.VITE_DEV_API_PROXY ?? 'http://wedding-invitation-api.test'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy API through the Vite origin so Sanctum cookies (XSRF-TOKEN /
    // session) are same-site as the SPA. Direct calls to *.test from
    // localhost:5173 cannot read those cookies → 419 CSRF on /api/login.
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/sanctum': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/storage': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
