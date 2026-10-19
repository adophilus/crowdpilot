import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import openapiTS, { astToString } from 'openapi-typescript'
import openapiJsonDocs from '@crowdpilot/api/openapi.json'

// ponytail: no binary-transform for now — no media endpoints yet. Add the
// Blob transform from Onscript's api-client-types when media uploads land.
const res = astToString(await openapiTS(openapiJsonDocs as any))

if (existsSync('./build')) {
  rmSync('./build', { recursive: true })
}

mkdirSync('./build')

writeFileSync('./build/types.ts', res, { encoding: 'utf8' })
console.log('✅ Build successful')
