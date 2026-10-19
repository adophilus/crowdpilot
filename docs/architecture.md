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
| Persistence | **Postgres on the VPS** (shared instance, `crowdpilot` db) via kysely + `packages/sql`; migrations runner; sessions as bearer tokens in localStorage | — |

Fresh code throughout, structured in Onscript's image. Onscript itself stays private and is only a *client dependency* (staging API) — never copied, never vendored.

## Repo layout

```
crowdpilot/
├─ apps/
│  ├─ backend/            # Effect HttpApi server (deployable to VPS)
│  │  └─ src/features/
│  │     ├─ config/       # Env → AppConfig two-layer pattern (fail loud at boot)
│  │     ├─ system/       # /health
│  │     ├─ auth/         # email OTP sign-in → session bearer tokens
│  │     ├─ qloo/         # QlooService (taste brain)
│  │     ├─ onscript/     # OnscriptService (publish hands)
│  │     ├─ llm/          # LlmService (agent loop + tool orchestration)
│  │     └─ profile/      # taste-profile store (per session/user)
│  └─ web/                # TanStack Start app (deployable to Vercel)
├─ packages/
│  ├─ api/                # HttpApi definition: route groups, one file/endpoint
│  ├─ api-client-types/   # generated: openapi-typescript → build/types.ts
│  ├─ api-client/         # createFetchClient + createTanstackQueryClient (+ makeApiClient bearer for web sessions)
│  ├─ sql/                # kysely db + types + migrations (users, sessions, connected_accounts)
│  └─ domain/             # shared effect-Schema types (stub, grow as needed)
├─ infra/                 # home-manager (in-repo): services/crowdpilot unit, sops secrets, deploy timer
├─ nix/                   # backend bundle derivation (copied shape from beta-lyfe)
├─ flake.nix              # outputs: crowdpilot-backend package + homeConfigurations.crowdpilot (via self)
└─ .github/workflows/     # ci.yml, cd.yml (build → cachix push), production.yaml (Vercel)
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
- **Auth**: email OTP sent from `hackathons@adophilus.com` via Purelymail SMTP (domain already fully on Purelymail — MX/SPF/DKIM/DMARC aligned, no DNS work; transactional mail is within their ToS) → `sessions` row → bearer token stored in **localStorage** (cross-origin Vercel→VPS makes cookies awkward; XSS accepted at hackathon scope). Publish + profile-write endpoints require a session; connecting accounts requires a session (OAuth happens through Onscript's flows; we store only the mapping user ↔ Onscript account id/platform). No orgs, no billing, no password resets.
- **Auth middleware**: same `HttpApiMiddleware.Tag` shape as Onscript's, one Live impl (`SessionMiddleware`) reading the bearer token → `sessions` lookup → provides `CurrentUser`.
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

## Persistence

- `packages/sql`: kysely client + schema types + SQL migrations (single runner script, run by ExecStartPre wrapper like beta-lyfe's migrate bundle).
- Tables (minimal): `users` (id, email, created_at), `sessions` (token_hash, user_id, expires_at), `connected_accounts` (user_id, platform, onscript_account_id, connected_at).
- Taste profiles: stored as JSONB on `users` (rebuildable from Qloo anytime) — no separate profiling infra.
- Seed script: demo persona user + pre-connected demo account (publish spike and judge demo run on this without auth).

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
- Connect-your-own flow (P1): user signs in here → deep-link to Onscript's per-platform OAuth initiate → after callback, `GET /integrations/connected-accounts` maps new accounts onto `connected_accounts` rows for that user.

## Frontend

TanStack Start (`apps/web`), `NITRO_PRESET=vercel`, typed via `api-client` + `openapi-react-query`. Public env `VITE_API_URL=https://api.crowdpilot.hackathons.adophilus.com` inlined at build. Screens: onboarding/picker → profile card → chat (streaming) → evidence panel (with/without toggle) → demo-persona button. Designed judge-flow-first (spec.md demo script).

## Deployment (beta-lyfe pattern; infra lives in this repo)

| Repo/dir | Changes |
|---|---|
| `crowdpilot` (public, MIT) | app code + flake outputs `packages.x86_64-linux.crowdpilot-backend` (nix/packages/backend-bundle.nix, esbuild, no pg-native) **and** `homeConfigurations.crowdpilot` (`infra/`: systemd **user** unit, sops `EnvironmentFile`, `deploy/` 5-min pull timer). Home config consumes the package via `self` — **no lockfile-bump step**. `cd.yml` = nix build → cachix push; `production.yaml` = Vercel prebuilt from temp dir |
| `vps/contabo` (personal) | users entry (system user, linger, deploy key, trusted-users) + one Caddy vhost `api.crowdpilot.hackathons.adophilus.com` → `127.0.0.1:1050` (explicit vhost, normal auto-TLS; DNS: `*.hackathons` wildcard, grey-clouded → VPS) |

Deploy flow: push main → CI builds + pushes Cachix → VPS timer pulls this repo → `home-manager switch` (package substitutes from cache) → Caddy TLS automatic. No SSH creds in CI (pull model). Cachix: **shared existing cache** (default; no per-project setup) — split later only if isolation is wanted.

**Secrets-in-public-repo rule:** `infra/services/crowdpilot/secrets.env` is sops-encrypted (age key only on the VPS). Only sops files may live under `infra/` — CI guard (few lines) fails on any non-sops file there. Plaintext secrets never touch this repo.

**Gotchas (from beta-lyfe recon):** secrets-only change deploys but does NOT restart the unit — restart manually and verify; deploy timer must not be `WantedBy=default.target` (loop); linger=true mandatory; cachix required (else full pnpm rebuild per deploy); cachix substituters must also be in user's `~/.config/nix/nix.conf` (trusted-users); first activation needs `XDG_RUNTIME_DIR`/`DBUS_SESSION_BUS_ADDRESS` prefix under runuser.

**Plan-B (only if Nix packaging stalls >1 day):** plain systemd user unit running `node dist/start.mjs`, rsync/scp deploy, same Caddy vhost. Same box, less reproducibility.

## Env vars

Backend (sops dotenv in `infra/`): `PORT=1050`, `NODE_ENV=production`, `DATABASE_URL=postgres://crowdpilot:…@127.0.0.1:5432/crowdpilot`, `QLOO_API_KEY`, `QLOO_BASE_URL=https://hackathon.api.qloo.com`, `ONSCRIPT_BASE_URL=<staging>`, `ONSCRIPT_SESSION_TOKEN`, `SMTP_HOST=smtp.purelymail.com`, `SMTP_PORT=587`, `SMTP_USER=hackathons@adophilus.com`, `SMTP_PASS=<app/mailbox password>`, `LLM_API_KEY`, `LLM_BASE_URL` (if non-default).
Frontend (Vercel/workflow): `VITE_API_URL`.

## Risks

| Risk | Mitigation |
|---|---|
| Qloo key arrives late | Mock layer (fixtures) from day one; live swap is a config change |
| Nix packaging of fresh backend stalls | Plan-B systemd fallback; bundle.nix is a near-verbatim adapt |
| Onscript session token expiry mid-demo | Refresh script + deploy checklist; re-login is 2 min |
| 402 plan limits on demo account | Verify headroom D1; backup account |
| Qloo place coverage thin (Lagos) | D2 check; NYC fallback persona is config-only |
| Public backend abuse of publish | publish requires a session; demo persona read-only |
| Scope creep | P2 = rewards only; freeze D9 hard |
| Plaintext secret lands in the public repo | sops-only rule under `infra/` + CI guard |
| OTP email deliverability / spam folder | Purelymail SMTP is domain-aligned (SPF/DKIM); seed-session fallback for the owner demo path; a few obscure receivers block Purelymail (their own FAQ) — acceptable for hackathon audience |
| DB forgot to migrate on deploy | ExecStartPre migrate wrapper (beta-lyfe pattern) + health probe |
