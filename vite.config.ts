import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // "::" dual-stacks on Linux so both 127.0.0.1 and localhost (::1) work.
    host: "::",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "::",
    port: 4173,
    strictPort: true,
  },
})
