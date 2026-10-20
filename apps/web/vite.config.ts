import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'

// Deploy: NITRO_PRESET=vercel is injected by the Vercel workflow
// (production.yaml, deploy lane) — no preset here so local dev stays nitro-node.
// plugin-react supplies the React Refresh runtime tanstackStart needs in dev.
export default defineConfig({
  plugins: [tanstackStart(), react()]
})
