# CrowdPilot — Architecture

> Full recon artifacts: Onscript skeleton map + VPS deploy recipe at
> `.pi/agent/sessions/.../subagent-artifacts/outputs/{8ee04ed9…,6229a2b2…}/context.md` (paths in session log).
> This doc is the operating summary; the artifacts are the deep reference.

## Stack

| Layer | Tech | Runs on |
|---|---|---|
| Monorepo | pnpm + nx (task runner/cacher only) | — |
| Backend | Effect-TS (`@effect/platform` HttpApi), esbuild-bundled single `.mjs` | Personal VPS (NixOS, systemd user service, port **1050**) |
| Frontend | TanStack Start | Vercel (prebuilt CLI deploys) |
| Typed APIs | `packages/api` (Effect HttpApi) → `openapi.json` → `api-client-types` → `api-client` (openapi-fetch + openapi-react-query) | — |
| Lint/format | Biome (single root config) | — |
| Runtime | Node 22 (`.nvmrc`), tsx for dev | — |
| Persistence | **None.** In-memory + cookies. No DB, no migrations. | — |

Fresh code throughout, structured in Onscript's image. Onscript itself stays private and is only a *client dependency* (staging API) — never copied, never vendored.

## Repo layout

```
crowdpilot/
├─ apps/
│  ├─ backend/            # Effect HttpApi server (deployable to VPS)
│  │  └─ src/features/
│  │     ├─ config/       # Env → AppConfig two-layer pattern (fail loud at boot)
│  │     ├─ system/       # /health
│  │     ├─ qloo/         # QlooService (taste brain)
│  │     ├─ onscript/     # OnscriptService (publish hands)
│  │     ├─ llm/          # LlmService (agent loop + tool orchestration)
│  │     └─ profile/      # session taste-profile store (in-memory)
│  └─ web/                # TanStack Start app (deployable to Vercel)
├─ packages/
│  ├─ api/                # HttpApi definition: route groups, one file/endpoint
│  ├─ api-client-types/   # generated: openapi-typescript → build/types.ts
│  ├─ api-client/         # createFetchClient + createTanstackQueryClient (+ makeApiClient for Effect consumers)
│  └─ domain/             # shared effect-Schema types (stub, grow as needed)
├─ nix/                   # backend bundle derivation (copied shape from beta-lyfe)
├─ flake.nix              # packages backend, exports overlay for infra repo
└─ .github/workflows/     # ci.yml, cd.yml (cachix + infra lock bump), production.yaml (Vercel)
```

Omitted from Onscript's skeleton: sql-kysely, observability/OTel, auth internals, payments, workers/crons, docs app, Docker/nginx.

## Typed-API chain (nx `^build` keeps order)

1. `packages/api` build → `OpenApi.fromApi(Api)` → `build/openapi.json`
2. `packages/api-client-types` build → `build/types.ts`
3. `packages/api-client` → typed fetch/query clients for `apps/web`
4. Backend handlers: `HttpApiBuilder.group(Api, '<Group>', …)` per feature, merged in `ApiEndpointLayer`

Convention per route group: `src/<Group>/index.ts` (HttpApiGroup) + one `<Endpoint>.ts` (schemas + endpoint). Backend bootstrap: `HttpApiBuilder.serve(HttpMiddleware.logger)` + CORS + port from `AppConfig` via `Layer.unwrapEffect`. DepLayer rule: consumers merged **before** providers in `provideMerge` chains.

## Backend conventions

- **Config**: raw `EnvSchema` (Effect Config, SCREAMING_CASE, decode fails loudly at boot) → derived `AppConfigSchema` (nested, camelCase). Nothing reads `process.env` directly.
- **External clients** (Qloo/Onscript/LLM all follow the Neynar pattern):
  ```
  features/<client>/service/
    interface.ts   # Context.Tag, methods → Effect<Success, TaggedError>
    live.ts        # Layer.effect; config is the only dependency; Effect.tryPromise + Effect.withSpan per method
    error.ts       # Data.TaggedError classes
    mock.ts        # fixture-backed layer (Qloo before key arrives; Onscript before spike)
  ```
- **Auth**: no user accounts. One thin bearer middleware (`OWNER_TOKEN` env) guarding mutating endpoints (publish, profile write). Judge-facing reads stay open. Same `HttpApiMiddleware.Tag` shape as Onscript's, one Live impl.
- **Evidence rule**: every Qloo call appends `{request, response, spanId}` to the session's evidence log — feeds citations in chat and the with/without-Qloo panel.

## Agent layer

`features/llm` owns the tool-calling loop; `apps/web` consumes it via SSE stream. Tools = thin wrappers over QlooService/OnscriptService/profile store:

```ts
qloo_resolve(query, type?)                      // /search
qloo_profile(entityIds, tagIds?)                // insights + taste analysis → crowd profile card
qloo_affinities(profile, targetType, {near?, tags?})           // ranked picks + evidence
qloo_scene(near, "trending"|"events"|"new_spots")              // P1 feed
draft_post(platforms[], text, mediaIds?)        // DRAFT via Onscript
publish_post(platforms[], text, mediaIds?, scheduleAt?)        // requires owner token
list_connected_accounts()
```

Side-by-side panel: same prompt re-run with tools disabled; both transcripts cached server-side per session.

## Qloo integration

- Base URL `https://hackathon.api.qloo.com`, `X-Api-Key` header only.
- `filter.type` whitelist: `artist|brand|place|movie|tv_show|book|podcast|video_game|destination|person` (food → `place`/`brand`, music → `artist`). Never `/recommendations`.
- Invalid params **silently ignored** → validate against the Entity Type Parameter Guide; log every request/response.
- Empty `entities` ≠ error → friendly retry, suspect region coverage first.
- Private server-side caching allowed; **never commit Qloo response data** (rules violation).

## Onscript integration (client of staging)

- Endpoints: `POST /posts` (DRAFT/PUBLISHING/SCHEDULED, per-platform variants), `POST /posts/:id/publish`, `DELETE /posts/:id`, `GET /integrations/connected-accounts`, `GET /storage/signature` (Cloudinary upload).
- Auth: opaque bearer **session token** (email-OTP sign-in, scripted once per deploy; no Onscript code changes). Env: `ONSCRIPT_BASE_URL`, `ONSCRIPT_SESSION_TOKEN`.
- Watch `402` plan limits on the demo account.

## Frontend

TanStack Start (`apps/web`), `NITRO_PRESET=vercel`, typed via `api-client` + `openapi-react-query`. Public env `VITE_API_URL=https://<api-domain>` inlined at build. Screens: onboarding/picker → profile card → chat (streaming) → evidence panel (with/without toggle) → demo-persona button. Designed judge-flow-first (spec.md demo script).

## Deployment (beta-lyfe pattern, three repos)

| Repo | Changes |
|---|---|
| `crowdpilot` (public, MIT) | flake.nix + `nix/packages/backend-bundle.nix` (esbuild, no pg-native) → `packages.x86_64-linux.crowdpilot-backend`; `cd.yml` (nix build → cachix push → bump infra flake.lock); `production.yaml` (Vercel prebuilt from temp dir) |
| `crowdpilot-infra` (private) | home-manager flake: app repo as overlay input; `services/crowdpilot/default.nix` (systemd **user** unit, sops `EnvironmentFile`, ExecStart = server wrapper, Restart=on-failure); `services/crowdpilot/secrets.env` (sops: `PORT=1050`, `NODE_ENV=production`, `QLOO_API_KEY`, `ONSCRIPT_*`, `OWNER_TOKEN`, `LLM_API_KEY`); generic `deploy/` timer (5-min pull, switch on rev change) |
| `vps/contabo` (personal) | users entry (system user, linger, deploy key, trusted-users) + one Caddy vhost `api.<domain>` → `127.0.0.1:1050` |

Deploy flow: push main → CI builds via Cachix → bumps infra lock → VPS timer `home-manager switch` → Caddy TLS automatic. No SSH creds in CI (pull model).

**Gotchas (from beta-lyfe recon):** secrets-only change deploys but does NOT restart the unit — restart manually and verify; deploy timer must not be `WantedBy=default.target` (loop); linger=true mandatory; cachix required (else full pnpm rebuild per deploy); cachix substituters must also be in user's `~/.config/nix/nix.conf` (trusted-users); first activation needs `XDG_RUNTIME_DIR`/`DBUS_SESSION_BUS_ADDRESS` prefix under runuser.

**Plan-B (only if Nix packaging stalls >1 day):** plain systemd user unit running `node dist/start.mjs`, rsync/scp deploy, same Caddy vhost. Same box, less reproducibility.

## Env vars

Backend (sops dotenv in infra repo): `PORT=1050`, `NODE_ENV=production`, `QLOO_API_KEY`, `QLOO_BASE_URL=https://hackathon.api.qloo.com`, `ONSCRIPT_BASE_URL=<staging>`, `ONSCRIPT_SESSION_TOKEN`, `OWNER_TOKEN`, `LLM_API_KEY`, `LLM_BASE_URL` (if non-default).
Frontend (Vercel/workflow): `VITE_API_URL`.

## Risks

| Risk | Mitigation |
|---|---|
| Qloo key arrives late | Mock layer (fixtures) from day one; live swap is a config change |
| Nix packaging of fresh backend stalls | Plan-B systemd fallback; bundle.nix is a near-verbatim adapt |
| Onscript session token expiry mid-demo | Refresh script + deploy checklist; re-login is 2 min |
| 402 plan limits on demo account | Verify headroom D1; backup account |
| Qloo place coverage thin (Lagos) | D2 check; NYC fallback persona is config-only |
| Public backend abuse of publish | OWNER_TOKEN on mutating endpoints; demo persona read-only |
| Scope creep | P2 = rewards only; freeze D9 hard |
