import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import domReview from '@adophilus/dom-review'

// Deploy: NITRO_PRESET=vercel is injected by the Vercel workflow
// (production.yaml, deploy lane) — no preset here so local dev stays nitro-node.
// plugin-react supplies the React Refresh runtime tanstackStart needs in dev.
// domReview is dev-only (apply: 'serve') — never in the build.
export default defineConfig({
  plugins: [tanstackStart(), react(), domReview()]
})
