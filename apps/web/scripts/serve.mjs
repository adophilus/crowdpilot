// Minimal node host for the TanStack Start SSR bundle (dist/server/server.js).
// Serves dist/client static assets directly; everything else goes to the
// SSR handler. Same-origin API: Caddy routes /api/* to the backend, so the
// app is built with VITE_API_URL=/api and this server never touches the API.
import { createServer } from 'node:http'
import { stat, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'
import handler from './server.mjs'

const port = Number(process.env.PORT || 3000)
const here = dirname(fileURLToPath(import.meta.url))
const clientDir = join(here, '..', 'dist', 'client')

const MIME = {
  '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.map': 'application/json'
}

async function serveStatic(pathname, method, res) {
  if (method !== 'GET' && method !== 'HEAD') return false
  const safe = join(clientDir, pathname.replace(/\.\./g, ''))
  if (!safe.startsWith(clientDir)) return false
  try {
    const st = await stat(safe)
    if (!st.isFile()) return false
    res.writeHead(200, {
      'Content-Type': MIME[extname(safe)] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable'
    })
    if (method === 'HEAD') { res.end(); return true }
    res.end(await readFile(safe))
    return true
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)

    // static assets first (hashed /assets/* paths)
    if (await serveStatic(url.pathname, req.method, res)) return

    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
    }
    const method = req.method ?? 'GET'
    const request = new Request(url, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : req,
      duplex: 'half'
    })

    const response = await handler.fetch(request)
    const out = {}
    response.headers.forEach((v, k) => { out[k] = v })
    res.writeHead(response.status, out)
    if (response.body) {
      const { Readable } = await import('node:stream')
      const nodeStream = Readable.fromWeb(response.body)
      nodeStream.pipe(res)
      nodeStream.on('error', () => res.destroy())
    } else {
      res.end()
    }
  } catch (error) {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('internal error')
    console.error('[serve]', error)
  }
})

server.listen(port, () => console.log(`crowdpilot web listening on :${port}`))
