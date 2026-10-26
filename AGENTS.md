# Agent Guidelines for CrowdPilot

Qloo Agentic Hackathon submission — "Agents, but with taste." A cultural
co-pilot for small businesses: it builds your business's taste profile from
Qloo and through chat it decides (what to stock, play, serve, host), creates
(posts tailored to that profile), and ships (publishes to X/IG/FB via
Onscript). Deadline: Oct 30, 2026, 11:45pm EDT. **The repo is public and
MIT-licensed — no secrets, no committed Qloo response data, ever.**

Deep docs live in `docs/` (spec, architecture, plan, deploy-notes). This file
is the operational always-loaded layer.

## 1. Essential Commands

```bash
# Dev stack (tmux window `stack` in the qloo-agentic-hackathon session)
process-compose up --config process-compose.dev.yaml --port 4234
# CLI against the running stack (logs/status/restart — never parse the TUI):
process-compose -p $PC_PORT process list -o json
process-compose -p $PC_PORT project is-ready

# Quality gates (all must pass before any commit)
pnpm build && pnpm lint && pnpm typecheck

# DB
pnpm --filter @crowdpilot/sql migrate
pnpm --filter backend seed        # demo user + session token (printed)

# Real-publish spike (fires a REAL tweet to the connected account)
pnpm --filter backend spike:publish -- --yes     # add --mock for fixtures
```

## 2. Ports & Env

| Thing | Port / value |
|---|---|
| Backend API | `:1050` (`GET /health` = readiness) |
| Web (TanStack Start dev) | `:3000` |
| Website (TanStack Start dev) | `:3001` |
| process-compose CLI | `:4234` (`PC_PORT` in env files) |
| Postgres (dev) | docker container `crowdpilot-dev-pg`, `127.0.0.1:5432` |
| Qloo base URL | `https://hackathon.api.qloo.com` (hackathon keys ONLY work here) |
| Onscript | `https://api.onscript.xyz` |

Env: direnv loads `.env` + `.env.${APP_ENV}` (default `.env.development`,
gitignored). The backend dev script ALSO passes
`--env-file-if-exists=../../.env.development` to tsx — both mechanisms
coexist. Vite reads only `apps/web/.env*`; `VITE_API_URL` falls back to
`http://localhost:1050`.

## 3. Architecture Rules

Monorepo: pnpm + nx (task runner only). `apps/backend` (Effect HttpApi) +
`apps/web` (TanStack Start) + `packages/{api,api-client-types,api-client,sql,domain}`.
Packages export raw TS (`"exports": "./src/index.ts"`); consumers compile via
tsx. Build order via nx `^build`: api → openapi.json → api-client-types →
api-client.

- **Typed-API chain**: define endpoints in `packages/api/src/<Group>/`
  (one file per endpoint), OpenApi build → generated client types → frontend
  uses `createFetchClient`/`createTanstackQueryClient`. Server handlers:
  `HttpApiBuilder.group(Api, '<Group>', …)` in `features/<x>/route/`.
- **Service pattern** (every external client): `service/{interface,live,error,mock}.ts`
  — Context.Tag interface, `Layer.effect` live, `Data.TaggedError` errors,
  fixture-backed mock. Config is the only dependency; never read
  `process.env` outside `features/config`.
- **Config**: two layers — raw `EnvSchema` (Effect Config, SCREAMING_CASE,
  fails loudly at boot) → derived `AppConfigSchema` (nested camelCase).
- **Layer ordering**: in `Layer.provideMerge` chains, a layer that CONSUMES a
  service merges BEFORE the layer that PROVIDES it (see bootstrap.ts).
- **Middleware**: `HttpApiMiddleware.Tag` defined in packages/api, one Live
  impl in the backend (see SessionMiddleware / features/auth/middleware).
- **Evidence rule**: every Qloo/Onscript call appends request+response to the
  EvidenceStore — chat citations and the with/without-Qloo panel consume it.

## 4. Gotchas (all hit for real — do not re-learn them)

1. **HttpApi path params use COLON syntax** in @effect/platform 0.82:
   `'/x/:id'`, not `'/x/{id}'`. Curly braces register as a literal segment and
   404 silently (OpenAPI spec still looks correct — braces are normalized
   there, masking the bug).
2. **Qloo silently ignores invalid parameters** — a 200 with empty
   `entities` usually means a param invalid for the `filter.type`. Validate
   against the Entity Type Parameter Guide before debugging data.
3. **Music is `urn:entity:artist`**, food/dining is `place`/`brand`. Never
   `/recommendations` (legacy, unsupported).
4. **tsx watch does NOT watch symlinked workspace packages** — editing
   `packages/*` requires a backend restart to take effect.
5. **NEVER run bare `pkill -f tsx`** — it matches your own shell and kills it.
   Use `pkill -f 'start\.ts'` (backend) or `pkill -f 'start\.mjs'` (bundle).
6. **process-compose**: config is read at startup — `process restart` re-runs
   the command but NOT probe/config changes; restart the whole window after
   editing the yaml. Use `exec` probes (`curl --fail URL`); `http_get` probes
   drop the port and hit port 80. After env-file changes, a restart does not
   reload them either.
7. **Vite first compile exceeds short timeouts** — allow 30-60s warmup before
   probing :3000.
8. **Onscript API quirks**: publish (`POST /posts/:id/publish`) requires a
   JSON body even when empty — send `{}`. Create returns `{id}` only; real
   status comes from `getPost`.
9. **Plan limits return 402** from Onscript — the demo account must have
   posting headroom.

## 5. Submission Constraints (hackathon rules)

- Public repo, MIT license in About — keep it that way.
- Hosted live demo (Vercel web + VPS backend via the nix/infra pipeline in
  `docs/deploy-notes.md`).
- No demo video; text description only. Qloo usage must be genuine and
  non-trivial (judging criterion #1).
