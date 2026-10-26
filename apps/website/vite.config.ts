import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

// Static marketing site: every page is prerendered to HTML at build time
// (crawlLinks follows in-app links), so dist/client is deployable as-is.
// plugin-react supplies the React Refresh runtime tanstackStart needs in dev.
export default defineConfig({
  plugins: [
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    react()
  ]
})
