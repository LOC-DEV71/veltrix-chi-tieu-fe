import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const buildTime = Date.now().toString();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-version-file',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'meta.json',
          source: JSON.stringify({ version: buildTime })
        });
      }
    }
  ],
  define: {
    // Tự động inject timestamp lúc build - mỗi lần Vercel deploy là khác nhau
    __BUILD_TIME__: JSON.stringify(buildTime),
  }
})
