import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { OpenApi } from '@effect/platform'
import { Api } from '../src'

const spec = OpenApi.fromApi(Api)

if (existsSync('./build')) {
  rmSync('./build', { recursive: true })
}

mkdirSync('./build')

writeFileSync('./build/openapi.json', JSON.stringify(spec, null, 2), {
  encoding: 'utf8'
})

console.log('✅ Build successful')
