import { Effect, Layer } from 'effect'
import { LlmService, type LlmMessage, type LlmTool } from '@/features/llm'
import {
  OnscriptService,
  type OnscriptPlatform
} from '@/features/onscript'
import { QlooService, type QlooEntityType } from '@/features/qloo/service'
import { AgentServiceError } from './error'
import {
  AgentService,
  type AgentEvent,
  type AgentRunArgs,
  type AgentRunResult,
  type AgentToolCall
} from './interface'

const MAX_ITERATIONS = 6
// ponytail: conversation state is an in-memory Map — single-process demo,
// restarts lose chats. Persist to the sessions/users table if that matters.
const sessions = new Map<string, LlmMessage[]>()
const MAX_HISTORY = 40

const SYSTEM_PROMPT_GROUNDED = `You are CrowdPilot, a cultural co-pilot for small businesses (cafés, bars, boutiques). You advise using the owner's crowd's actual taste data.
Rules:
- Ground every recommendation in tool results. Call the qloo_* tools before advising; never invent entities that tools didn't return.
- When citing Qloo data, reference the evidence refs the tools return, like [ev_0007].
- draft_post does NOT publish; it returns a draft for the user to confirm. For publish_post, ALWAYS confirm the exact text with the user before calling it.
- If the requested platform has no connected account (check list_connected_accounts), say so and offer the platforms that are connected.
- Keep answers short, specific and actionable.`

const SYSTEM_PROMPT_PLAIN =
  'You are CrowdPilot, a helpful assistant for small business owners (cafés, bars, boutiques). Answer from your general knowledge. Keep answers short and actionable.'

const ENTITY_TYPES: ReadonlyArray<QlooEntityType> = [
  'artist',
  'brand',
  'place',
  'movie',
  'tv_show',
  'book',
  'podcast',
  'video_game',
  'destination',
  'person'
]

const PLATFORMS: ReadonlyArray<OnscriptPlatform> = [
  'TWITTER',
  'INSTAGRAM',
  'FACEBOOK'
]

const TOOLS: ReadonlyArray<LlmTool> = [
  {
    type: 'function',
    function: {
      name: 'qloo_search',
      description:
        'Search the Qloo cultural database for entities (artists, brands, places, ...). Use to resolve names the user mentions into entity ids.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Free-text search, e.g. "Kabza De Small"'
          },
          type: { type: 'string', enum: ENTITY_TYPES }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'qloo_build_profile',
      description:
        'Build the crowd taste profile from the entities the crowd loves. Each entity may be a search query ("Kabza De Small") or a Qloo entity id; queries are resolved via search first. Returns top audience tags, cross-domain affinities (music/places/brands/movies) and evidence refs.',
      parameters: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Entity names or Qloo entity ids'
          }
        },
        required: ['entities']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'qloo_affinities',
      description:
        'Ranked picks in one domain (artist/place/brand/movie) for a crowd defined by entities. Returns scored picks + evidence refs. Use for "what should I play / stock / sponsor" questions.',
      parameters: {
        type: 'object',
        properties: {
          entities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Entity names or Qloo entity ids defining the crowd'
          },
          targetType: { type: 'string', enum: ENTITY_TYPES }
        },
        required: ['entities', 'targetType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_connected_accounts',
      description:
        'List the social accounts connected via Onscript (platform, username, active status).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'draft_post',
      description:
        'Create a DRAFT social post (not published). Present the draft to the user for confirmation before any publish_post call.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: PLATFORMS },
          text: {
            type: 'string',
            description: 'Post text, platform-appropriate length'
          }
        },
        required: ['platform', 'text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'publish_post',
      description:
        'Publish a post to a connected account. Requires an active connected account for the platform. Only call AFTER the user confirmed the exact text.',
      parameters: {
        type: 'object',
        properties: {
          platform: { type: 'string', enum: PLATFORMS },
          text: {
            type: 'string',
            description: 'Confirmed post text (when publishing without a prior draft)'
          },
          postId: { type: 'string', description: 'Id from draft_post to publish that draft' }
        },
        required: ['platform']
      }
    }
  }
]

interface ToolOutcome {
  readonly content: string
  readonly summary: string
  readonly refs: ReadonlyArray<string>
}

const jsonOf = (value: unknown) => JSON.stringify(value)

const asPlatform = (value: unknown): OnscriptPlatform | undefined =>
  PLATFORMS.includes(value as OnscriptPlatform)
    ? (value as OnscriptPlatform)
    : undefined

const asEntityType = (value: unknown): QlooEntityType | undefined =>
  ENTITY_TYPES.includes(value as QlooEntityType)
    ? (value as QlooEntityType)
    : undefined

const makeLive = Effect.gen(function* () {
  const llm = yield* LlmService
  const qloo = yield* QlooService
  const onscript = yield* OnscriptService

  // Resolve entity names via search; pass urn ids through untouched.
  const resolveEntities = (queries: ReadonlyArray<unknown>) =>
    Effect.gen(function* () {
      const ids: string[] = []
      const names: string[] = []
      const misses: string[] = []
      for (const raw of queries) {
        const query = String(raw ?? '').trim()
        if (!query) continue
        if (query.startsWith('urn:')) {
          ids.push(query)
          names.push(query)
          continue
        }
        const hits = yield* qloo.search(query)
        const hit = hits[0]
        if (hit) {
          ids.push(hit.id)
          names.push(hit.name)
        } else {
          misses.push(query)
        }
      }
      return { ids, names, misses }
    })

  const toolError = (what: string, cause: unknown): ToolOutcome => ({
    content: jsonOf({ ok: false, error: `${what} failed: ${String(cause)}` }),
    summary: `${what}: error`,
    refs: []
  })

  const executeTool = (
    name: string,
    rawArgs: string
  ): Effect.Effect<ToolOutcome> =>
    Effect.gen(function* () {
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(rawArgs || '{}') as Record<string, unknown>
      } catch {
        return {
          content: jsonOf({ ok: false, error: 'arguments were not valid JSON' }),
          summary: `${name}: invalid arguments`,
          refs: []
        }
      }

      switch (name) {
        case 'qloo_search': {
          const query = String(args.query ?? '')
          const type = asEntityType(args.type)
          const entities = yield* qloo.search(query, type)
          return {
            content: jsonOf({ ok: true, entities }),
            summary: `${entities.length} result(s) for "${query}"`,
            refs: []
          }
        }

        case 'qloo_build_profile': {
          const queries = Array.isArray(args.entities) ? args.entities : []
          const resolved = yield* resolveEntities(queries)
          if (resolved.ids.length === 0) {
            return {
              content: jsonOf({
                ok: false,
                error: `no entities found for: ${resolved.misses.join(', ') || '(empty)'}`
              }),
              summary: 'no entities resolved',
              refs: []
            }
          }
          const profile = yield* qloo.buildProfile(resolved.ids)
          return {
            content: jsonOf({ ok: true, profile, resolvedNames: resolved.names }),
            summary: `profile for ${resolved.names.join(', ')}: ${profile.topTags
              .slice(0, 3)
              .map((tag) => `${tag.tag} ${tag.score}`)
              .join(', ')}`,
            refs: profile.evidenceRefs
          }
        }

        case 'qloo_affinities': {
          const queries = Array.isArray(args.entities) ? args.entities : []
          const targetType = asEntityType(args.targetType)
          if (!targetType) {
            return {
              content: jsonOf({ ok: false, error: 'invalid targetType' }),
              summary: 'invalid targetType',
              refs: []
            }
          }
          const resolved = yield* resolveEntities(queries)
          if (resolved.ids.length === 0) {
            return {
              content: jsonOf({
                ok: false,
                error: `no entities found for: ${resolved.misses.join(', ') || '(empty)'}`
              }),
              summary: 'no entities resolved',
              refs: []
            }
          }
          const result = yield* qloo.insights({
            filterType: targetType,
            signalEntityIds: resolved.ids
          })
          return {
            content: jsonOf({ ok: true, picks: result.entities }),
            summary: `top ${targetType}: ${result.entities
              .slice(0, 3)
              .map((entity) => `${entity.name} ${entity.score ?? ''}`)
              .join(', ')}`,
            refs: result.evidenceRefs
          }
        }

        case 'list_connected_accounts': {
          const accounts = yield* onscript.listConnectedAccounts()
          return {
            content: jsonOf({ ok: true, accounts }),
            summary: accounts.length
              ? accounts
                  .map(
                    (account) =>
                      `${account.platform} @${account.username}${account.isActive ? '' : ' (inactive)'}`
                  )
                  .join(', ')
              : 'none connected',
            refs: []
          }
        }

        case 'draft_post': {
          const platform = asPlatform(args.platform)
          const text = String(args.text ?? '')
          if (!platform || !text) {
            return {
              content: jsonOf({
                ok: false,
                error: 'draft_post needs platform (TWITTER/INSTAGRAM/FACEBOOK) and text'
              }),
              summary: 'invalid arguments',
              refs: []
            }
          }
          const accounts = yield* onscript.listConnectedAccounts()
          const account = accounts.find(
            (candidate) => candidate.platform === platform && candidate.isActive
          )
          if (!account) {
            return {
              content: jsonOf({
                ok: false,
                error: `no active ${platform} account is connected. Tell the user, and offer: ${accounts
                  .filter((candidate) => candidate.isActive)
                  .map((candidate) => candidate.platform)
                  .join(', ') || 'nothing — no accounts connected'}`
              }),
              summary: `no active ${platform} account`,
              refs: []
            }
          }
          const post = yield* onscript.createPost({
            status: 'DRAFT',
            variants: [{ platform, text, connectedAccountId: account.id }]
          })
          return {
            content: jsonOf({
              ok: true,
              postId: post.id,
              status: post.status,
              note: 'Draft created, NOT published. Ask the user to confirm before publish_post.'
            }),
            summary: `draft ${post.id} for ${platform} (${text.length} chars)`,
            refs: []
          }
        }

        case 'publish_post': {
          const platform = asPlatform(args.platform)
          if (!platform) {
            return {
              content: jsonOf({
                ok: false,
                error: 'publish_post needs platform (TWITTER/INSTAGRAM/FACEBOOK)'
              }),
              summary: 'invalid arguments',
              refs: []
            }
          }
          const accounts = yield* onscript.listConnectedAccounts()
          const account = accounts.find(
            (candidate) => candidate.platform === platform && candidate.isActive
          )
          if (!account) {
            // Polite refusal — the LLM relays this to the user.
            return {
              content: jsonOf({
                ok: false,
                error: `no active ${platform} account is connected, so the post cannot be published. Tell the user politely and offer: ${accounts
                  .filter((candidate) => candidate.isActive)
                  .map((candidate) => candidate.platform)
                  .join(', ') || 'nothing — no accounts connected'}`
              }),
              summary: `refused: no active ${platform} account`,
              refs: []
            }
          }
          const postId =
            typeof args.postId === 'string' && args.postId
              ? args.postId
              : (
                  yield* onscript.createPost({
                    status: 'PUBLISHING',
                    variants: [
                      {
                        platform,
                        text: String(args.text ?? ''),
                        connectedAccountId: account.id
                      }
                    ]
                  })
                ).id
          const published = yield* onscript.publishPost(postId)
          return {
            content: jsonOf({
              ok: true,
              postId: published.id,
              status: published.status,
              url: published.url
            }),
            summary: `published ${published.id} to ${platform}${published.url ? ` → ${published.url}` : ''}`,
            refs: []
          }
        }

        default:
          return {
            content: jsonOf({ ok: false, error: `unknown tool: ${name}` }),
            summary: `unknown tool ${name}`,
            refs: []
          }
      }
    }).pipe(Effect.catchAll((cause) => Effect.succeed(toolError(name, cause))))

  return AgentService.of({
    run: ({
      sessionId,
      message,
      mode = 'grounded',
      onEvent
    }: AgentRunArgs) =>
      Effect.gen(function* () {
        const id = sessionId ?? crypto.randomUUID()
        const emit = (event: AgentEvent) => {
          onEvent?.(event)
        }

        const messages: LlmMessage[] = [
          {
            role: 'system',
            content:
              mode === 'grounded' ? SYSTEM_PROMPT_GROUNDED : SYSTEM_PROMPT_PLAIN
          },
          ...(sessions.get(id) ?? []),
          { role: 'user', content: message }
        ]

        const evidenceRefs = new Set<string>()
        const toolCalls: AgentToolCall[] = []
        let text = ''

        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
          const result = yield* llm
            .chat({
              messages,
              tools: mode === 'grounded' ? TOOLS : undefined
            })
            .pipe(
              Effect.mapError(
                (cause) => new AgentServiceError({ cause })
              )
            )
          messages.push(result.message)

          const calls = result.message.tool_calls ?? []
          if (calls.length === 0) {
            text = result.message.content ?? ''
            break
          }

          for (const call of calls) {
            const outcome = yield* executeTool(
              call.function.name,
              call.function.arguments
            )
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: outcome.content
            })
            toolCalls.push({ name: call.function.name, summary: outcome.summary })
            for (const ref of outcome.refs) evidenceRefs.add(ref)
            emit({ type: 'tool', name: call.function.name, summary: outcome.summary })
            if (outcome.refs.length > 0) {
              emit({ type: 'evidence', refs: outcome.refs })
            }
          }
        }

        if (!text) {
          text = 'I could not finish that request — please try again.'
        }

        emit({ type: 'delta', text })
        emit({ type: 'done', text, evidenceRefs: [...evidenceRefs] })

        // Store without the system prompt (mode-dependent, re-added per run).
        const history = messages.slice(1)
        sessions.set(id, history.slice(-MAX_HISTORY))

        return {
          sessionId: id,
          text,
          evidenceRefs: [...evidenceRefs],
          toolCalls
        } satisfies AgentRunResult
      }).pipe(Effect.withSpan('agent.run'))
  })
})

export const AgentServiceLive = Layer.effect(AgentService, makeLive)
