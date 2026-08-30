import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Tự động inject timestamp lúc build - mỗi lần Vercel deploy là khác nhau
    __BUILD_TIME__: JSON.stringify(Date.now().toString()),
  }
})
