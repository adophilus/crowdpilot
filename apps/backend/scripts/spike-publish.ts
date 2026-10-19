import { Effect, Layer, Logger, LogLevel } from 'effect'
import { AppConfigLive } from '@/features/config'
import { EnvLive } from '@/features/config/env'
import { EvidenceStoreLive } from '@/features/evidence'
import {
  OnscriptService,
  OnscriptServiceLive,
  OnscriptServiceMockLive
} from '@/features/onscript'

// Real-publish spike: lists connected accounts, creates a DRAFT tweet,
// publishes it, prints id/status/permalink. Fires REAL posts — hence --yes.
// Run: pnpm --filter @crowdpilot/backend spike:publish -- --yes [--mock]

const argv = process.argv.slice(2)
const useMock = argv.includes('--mock')

if (!argv.includes('--yes')) {
  console.error(
    'Refusing to run: this publishes a REAL post through the Onscript API.\n' +
      'Usage: pnpm --filter @crowdpilot/backend spike:publish -- --yes [--mock]'
  )
  process.exit(1)
}

const TEXT = 'test post from CrowdPilot spike — ignore 🛠'

const program = Effect.gen(function* () {
  const onscript = yield* OnscriptService

  const accounts = yield* onscript.listConnectedAccounts()
  console.log('connected accounts:')
  for (const account of accounts) {
    console.log(
      `  - ${account.platform} @${account.username} (id=${account.id}, active=${account.isActive})`
    )
  }

  const twitter = accounts.find(
    (account) => account.platform === 'TWITTER' && account.isActive
  )
  if (!twitter) {
    throw new Error('no active TWITTER connected account — aborting')
  }

  const created = yield* onscript.createPost({
    status: 'DRAFT',
    variants: [
      { platform: 'TWITTER', text: TEXT, connectedAccountId: twitter.id }
    ]
  })
  console.log(`created post id=${created.id} status=${created.status}`)

  const published = yield* onscript.publishPost(created.id)
  console.log(`publish accepted: id=${published.id} status=${published.status}`)

  const final = yield* onscript.getPost(created.id)
  console.log(`final: id=${final.id} status=${final.status} url=${final.url ?? '(none)'}`)
  console.log(`PERMALINK: ${final.url ?? '(no permalink surfaced yet)'}`)
}).pipe(Effect.withSpan('spike.publish'))

const SpikeLayer = Layer.empty.pipe(
  Layer.provideMerge(useMock ? OnscriptServiceMockLive : OnscriptServiceLive),
  Layer.provideMerge(EvidenceStoreLive),
  Layer.provideMerge(AppConfigLive),
  Layer.provideMerge(EnvLive),
  Layer.provideMerge(Logger.pretty),
  Layer.provideMerge(Logger.minimumLogLevel(LogLevel.Debug))
)

Effect.runPromise(Effect.provide(program, SpikeLayer)).catch((error) => {
  console.error('spike failed:', error)
  process.exit(1)
})
