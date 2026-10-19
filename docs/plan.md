# CrowdPilot — 11-Day Execution Plan

Today = Sun Oct 19. Deadline **Thu Oct 30, 23:45 EDT** (submit Wed Oct 29 EOD — don't touch the wire).

## Critical path

**Qloo API key → Qloo tools → agent loop → demo.** Everything else is parallelizable or cuttable. The key request is the only externally-throttled step.

## Milestones

| Day | Date | Milestone | Done means |
|---|---|---|---|
| D1 | Sun 19 | Kickoff + unblock | Repo scaffolded, key form submitted, Onscript staging reachable + demo account has connected X/IG/FB + no 402s, Vercel project created |
| D2 | Mon 20 | Qloo client + profile builder | `/search`, `/v2/tags`, `/v2/insights` wrapped; profile card renders from real (or fixture) data; **Lagos coverage verified** (fallback NYC) |
| D3 | Tue 21 | Publish spike | `POST /posts` → live post on demo X account end-to-end (the riskiest integration proven early) |
| D4–5 | Wed 22–Thu 23 | Agent loop + decide tools | Chat with `qloo_*` tools working; answers cite evidence; profile persists per session |
| D6 | Fri 24 | Create + ship | Draft-post flow with grounding notes; publish from chat; image post if cheap |
| D7 | Sat 25 | Side-by-side panel + demo persona | LLM-vs-Qloo toggle works; "Try demo café" path < 60s to wow |
| D8 | Sun 26 | P1 scene feed + UI polish pass | Trending/events feed live; designer pass on chat + profile card |
| D9 | Mon 27 | **Feature freeze. Deploy.** | Live on Vercel, judge-flow rehearsal passes on the deployed URL |
| D10 | Tue 28 | Submission package | README, MIT license, Devpost description drafted, demo script rehearsed ×3, P2 scheduled-posts if slack |
| D11 | Wed 29 | Buffer + submit | Submit by EOD; freeze |

## Parallel lanes (dispatch order)

1. **Scaffold lane** (D1, worker): Next.js app, env plumbing, deploy pipeline to Vercel on day one.
2. **Qloo lane** (D2–4, worker): client + tools + fixtures; blocked only by key for live calls, not for code.
3. **Onscript lane** (D3, worker): publish spike against staging.
4. **Agent lane** (D4–6, main/worker): tool-calling loop, prompts, citation discipline.
5. **UI lane** (D7–8, designer): chat, profile card, evidence panel, demo-persona flow.
6. **Review gate** (D8, oracle): pre-freeze review of agent prompts + evidence quality.

Write ownership: lanes touch disjoint dirs (`src/lib/qloo`, `src/lib/onscript`, `src/app/...`) — no overlaps, parallel-safe.

## Risk register (top 5)

1. **Qloo key delay** — worst case D3. Fixtures unblock all code; swap live on arrival. If not arrived by D4 → ping form + Discord #api-help.
2. **Onscript session auth friction** — spike D3, earliest possible. Fallback ladder: longer-lived session → fresh token before demo → (last resort) tiny service-token path.
3. **Lagos place-data thin** — D2 check; NYC fallback costs nothing (persona is config).
4. **Scope creep** — P2 items are rewards, not obligations. Freeze is D9, no exceptions.
5. **Judge-flow flop** (demo persona >60s to wow) — D7 rehearsal gates the polish day.

## Submission checklist

- [ ] Live demo URL, publicly reachable, demo persona works without signup
- [ ] Public repo (GitHub), MIT license file, license visible in About section
- [ ] No Qloo response data or secrets committed
- [ ] Devpost text description: pitch paragraph + what makes it Qloo-powered + architecture blurb
- [ ] Team members registered on Devpost (if any)
- [ ] Submitted ≤ Wed Oct 29 EOD
