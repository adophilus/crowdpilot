import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

// Deploy: NITRO_PRESET=vercel is injected by the Vercel workflow
// (production.yaml, deploy lane) — no preset here so local dev stays nitro-node.
export default defineConfig({
  plugins: [tanstackStart()]
})
