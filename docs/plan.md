# CrowdPilot — 11-Day Execution Plan

Today = Sun Oct 19. Deadline **Thu Oct 30, 23:45 EDT** (submit Wed Oct 29 EOD — don't touch the wire).

## Critical path

**Qloo API key → Qloo tools → agent loop → demo.** Everything else is parallelizable or cuttable. The key request is the only externally-throttled step. Stack: pnpm/nx monorepo, Effect backend on VPS (port 1050), TanStack Start web on Vercel — see architecture.md.

## Milestones

| Day | Date | Milestone | Done means |
|---|---|---|---|
| D1 | Sun 19 | Kickoff + unblock | Monorepo skeleton live (typed-API chain green: api → openapi → client-types → client → backend `/health`), key form submitted, Onscript staging reachable + demo account has connected X/IG/FB + no 402s, Vercel project created |
| D2 | Mon 20 | Qloo client + profile builder + deploy wiring + DB | Qloo feature (mock + live layers); profile card renders; **Lagos coverage verified** (fallback NYC); nix bundle builds, CI + infra/ + Caddy vhost wired, backend reachable at `api.crowdpilot.hackathons.adophilus.com`; pg db + role created, migrations run |
| D3 | Tue 21 | Publish spike | `POST /posts` → live post on demo X account end-to-end from the deployed backend, using a **seeded session** (riskiest integration proven early, not gated on auth) |
| D4–5 | Wed 22–Thu 23 | Agent loop + decide tools + auth | Chat with `qloo_*` tools working; answers cite evidence; email-OTP sign-in live; publish requires session |
| D6 | Fri 24 | Create + ship | Draft-post flow with grounding notes; publish from chat; image post if cheap |
| D7 | Sat 25 | Side-by-side panel + demo persona + connect-your-own | LLM-vs-Qloo toggle works; "Try demo café" path < 60s to wow; connect-own-X flow live if Onscript OAuth deep-link cooperates |
| D8 | Sun 26 | P1 scene feed + UI polish pass | Trending/events feed live; designer pass on chat + profile card |
| D9 | Mon 27 | **Feature freeze. Deploy.** | Live on Vercel, judge-flow rehearsal passes on the deployed URL |
| D10 | Tue 28 | Submission package | README, MIT license, Devpost description drafted, demo script rehearsed ×3, P2 scheduled-posts if slack |
| D11 | Wed 29 | Buffer + submit | Submit by EOD; freeze |

## Parallel lanes (dispatch order)

1. **Scaffold lane** (D1, worker): monorepo skeleton per architecture.md — workspace files, `packages/api` (+System group), `api-client-types`, `api-client`, `apps/backend` (config pattern, bootstrap, `/health`), `apps/web` (TanStack Start starter hitting `/health`).
2. **Deploy lane** (D2, worker): flake (backend package + in-repo `homeConfigurations`), `infra/` (service unit + sops env + deploy timer), `cd.yml`/`production.yaml`, vps repo Caddy vhost. Domain confirmed: `api.crowdpilot.hackathons.adophilus.com`; cachix = shared. Plan-B: plain systemd unit if Nix stalls.
3. **Qloo lane** (D2–4, worker): qloo feature (mock + live layers) + profile endpoints; blocked only by key for live calls, not for code.
4. **Onscript lane** (D3, worker): onscript feature + publish spike against staging from the deployed backend.
5. **Agent lane** (D4–6, main/worker): llm feature, tool loop, prompts, citation discipline, SSE endpoint.
6. **Auth/DB lane** (D2–4, worker, after scaffold): `packages/sql` (kysely + migrations: users/sessions/connected_accounts), `features/auth` (email OTP via Resend, SessionMiddleware), Auth route group, seed script (demo persona + pre-connected account). Publish gate switches from seed to real sessions at D4.
7. **UI lane** (D7–8, designer): chat, profile card, evidence panel, demo-persona flow.
8. **Review gate** (D8, oracle): pre-freeze review of agent prompts + evidence quality.

Write ownership: lanes touch disjoint dirs (`features/{qloo,onscript,llm}`, `packages/api/src/<Group>`, `apps/web/...`, nix/CI files) — no overlaps, parallel-safe.

## Risk register (top 5)

1. **Qloo key delay** — worst case D3. Fixtures unblock all code; swap live on arrival. If not arrived by D4 → ping form + Discord #api-help.
2. **Onscript session auth friction** — spike D3, earliest possible. Fallback ladder: longer-lived session → fresh token before demo → (last resort) tiny service-token path.
3. **Lagos place-data thin** — D2 check; NYC fallback costs nothing (persona is config).
4. **Scope creep** — P2 items are rewards, not obligations. Freeze is D9, no exceptions.
5. **Judge-flow flop** (demo persona >60s to wow) — D7 rehearsal gates the polish day.
6. **Nix packaging of fresh backend stalls** — bundle.nix is a near-verbatim adapt of beta-lyfe's; plan-B is a plain systemd unit + rsync if it eats >1 day.

## Submission checklist

- [ ] Live demo URL, publicly reachable, demo persona works without signup
- [ ] Public repo (GitHub), MIT license file, license visible in About section
- [ ] No Qloo response data or secrets committed
- [ ] Devpost text description: pitch paragraph + what makes it Qloo-powered + architecture blurb
- [ ] Team members registered on Devpost (if any)
- [ ] Submitted ≤ Wed Oct 29 EOD
