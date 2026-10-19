import { shouldUseQlooMock } from '@/features/qloo/service'

// Config wiring self-check: mock wins when flagged on OR key is
// missing/placeholder; live only with mock=false + a real key.
// Run: pnpm --filter @crowdpilot/backend check:qloo-config

const cases: ReadonlyArray<
  [{ mock: boolean; apiKey: string }, boolean, string]
> = [
  [
    { mock: true, apiKey: 'dev-placeholder' },
    true,
    'QLOO_MOCK=true + placeholder key -> mock'
  ],
  [
    { mock: true, apiKey: 'real-key' },
    true,
    'QLOO_MOCK=true forces mock even with a real key'
  ],
  [
    { mock: false, apiKey: 'dev-placeholder' },
    true,
    'placeholder key without flag still selects mock'
  ],
  [
    { mock: false, apiKey: '' },
    true,
    'missing key selects mock'
  ],
  [
    { mock: false, apiKey: 'real-key' },
    false,
    'real key + flag off -> live'
  ]
]

let failed = 0
for (const [config, expected, label] of cases) {
  const actual = shouldUseQlooMock(config)
  if (actual !== expected) {
    console.error(`FAIL: ${label} (expected ${expected}, got ${actual})`)
    failed++
  } else {
    console.log(`ok: ${label}`)
  }
}

if (failed > 0) {
  process.exit(1)
}
console.log('✅ qloo config logic OK')
