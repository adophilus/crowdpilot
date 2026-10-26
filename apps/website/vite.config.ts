import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import domReview from '@adophilus/dom-review'

// Static marketing site: every page is prerendered to HTML at build time
// (crawlLinks follows in-app links), so dist/client is deployable as-is.
// plugin-react supplies the React Refresh runtime tanstackStart needs in dev.
// domReview is dev-only (apply: 'serve') — never in the build/prerender.
export default defineConfig({
  plugins: [
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    react(),
    domReview()
  ]
})
