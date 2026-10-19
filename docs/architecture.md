# CrowdPilot — Architecture

## Stack (default unless changed)

- **Next.js (App Router) + TypeScript**, hosted on **Vercel** — chat UI + API routes in one deployable unit.
- **Vercel AI SDK** for the agent loop (tool-calling streaming chat). Any capable LLM works; pin one env var.
- **Qloo client**: thin typed wrapper over the hackathon base URL `https://hackathon.api.qloo.com`. Server-side only; key never reaches the browser.
- **Onscript**: existing staging deployment, called as a service. Session-token bearer auth (see below).
- **Persistence: none.** Demo persona + current session state live server-side in memory / cookies. No DB. Revisit only if scheduled posts (P2) need durability.

## Components

```
[Chat UI]──(stream)──[Agent route: LLM + tools]
                          ├─ Qloo tools ──── Qloo API (hackathon.api.qloo.com)
                          ├─ Publish tool ── Onscript staging API
                          └─ Profile store ── (in-memory / cookie)
```

## Qloo integration

- Endpoints used: `GET /search` (entity IDs), `GET /v2/tags` (tag IDs), `GET /v2/insights` (affinities; taste analysis via tag metadata), optional geo filters for places.
- `filter.type` whitelist: `urn:entity:artist|brand|place|movie|tv_show|book|podcast|video_game|destination|person`. Food = `place`/`brand`, music = `artist`. Never `/recommendations` (legacy, unsupported).
- **Silent-ignore gotcha:** invalid params are dropped without error — validate against the Entity Type Parameter Guide, and log every request/response pair (also feeds the evidence panel + audit trail).
- Empty `entities` array ≠ error: usually invalid param-for-type or no data for region. Surface a friendly retry.
- Auth: `X-Api-Key` header only. Private server-side caching allowed (and wanted); **never commit cached Qloo data to the public repo** (rules violation).

## Agent tool schemas (first pass)

```ts
// Qloo tools
qloo_resolve(query: string, type?: EntityType): Entity[]            // /search
qloo_profile(entityIds: string[], tagIds?: string[]): Profile        // insights+tags → crowd taste card
qloo_affinities(profile, targetType: EntityType, opts?: { near?: LatLng, tags?: string[] }): ScoredEntity[]
qloo_scene(near: LatLng, kind: "trending" | "events" | "new_spots"): SceneItem[]   // P1 feed

// Onscript tool
publish_post(platforms: ("x"|"instagram"|"facebook")[], text: string, mediaIds?: string[], scheduleAt?: string): { postId, status }
// + list_connected_accounts() so the UI can show targets before publishing
```

Rules: every tool result carries its raw Qloo evidence (scores/tags) into the transcript so drafts can cite it; publish requires explicit user confirmation in-chat.

## Onscript integration (from recon of `packages/api`, `main` worktree)

- `POST /posts` — body with status `DRAFT | PUBLISHING | SCHEDULED` and per-platform variants (`PlatformPostVariant`: TWITTER/FACEBOOK/INSTAGRAM = text + media_ids).
- `POST /posts/:id/publish`, `DELETE /posts/:id`, retry support.
- `GET /integrations/connected-accounts` — list targets.
- `GET /storage/signature` → Cloudinary signed upload for media → pass `media_ids`.
- **Auth:** opaque bearer session token (email-OTP/Google sign-in), DB-backed; **no API keys**. Strategy: scripted one-time sign-in on deploy → store session token as an env secret; refresh when it expires. Do NOT modify Onscript for this (last resort only, see spec out-of-scope).
- FB/IG publishing rides Onscript's PostForMe integration; X is direct. Plan limits → watch for `402`; demo account must have headroom.
- Env: `ONSCRIPT_BASE_URL` (staging), `ONSCRIPT_SESSION_TOKEN`, and platform creds stay server-side in the Onscript deployment — our app only needs base URL + session token.

## Evidence panel (with/without Qloo)

Same user question runs twice: once with tools, once LLM-only (tools disabled). Both answers render side-by-side with the Qloo call log under the grounded one. Cache both — judges will flip this toggle repeatedly.

## Deployment

- Vercel (hobby) + env vars: `QLOO_API_KEY`, `QLOO_BASE_URL=hackathon.api.qloo.com`, `ONSCRIPT_BASE_URL`, `ONSCRIPT_SESSION_TOKEN`, `LLM_API_KEY`.
- Custom README with: live demo URL, "try demo persona" note, architecture blurb, MIT license.
- Public repo contains **only** this app. Onscript stays private; it's a third-party service from the repo's perspective.

## Risks

| Risk | Mitigation |
|---|---|
| Qloo key arrives late (manual provisioning, ~days) | Submitted D1; build against recorded fixtures until then; every tool behind a thin client |
| Qloo place coverage thin for Lagos | Verify D2 with key; fallback demo persona = NYC |
| Onscript session token expiry mid-demo | Refresh script; re-login checklist in deploy notes |
| 402 plan limit on demo account | Confirm headroom D1; second backup account |
| Serverless in-memory state resets | Profile serialised to cookie; demo persona deterministic from fixtures |
