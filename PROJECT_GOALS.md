# PROJECT_GOALS.md

*Last updated: Oct 20, 2026 (day 2 of the Qloo Agentic Hackathon — submission due Oct 30)*

## The one-line thesis

**Culture is data. CrowdPilot makes cultural intelligence executable.**

Every organization with an audience makes dozens of cultural decisions a week —
what to play, stock, serve, host, post, sponsor, and who to partner with. Today
those decisions run on gut feel or generic AI prediction. CrowdPilot grounds them
in Qloo's taste graph (250M+ entities of real cultural affinity data), then
executes them — the same conversation that decides the weekend playlist can
publish the post about it.

## The core abstraction (why this generalizes)

Strip the demo persona away and CrowdPilot is three domain-agnostic primitives:

1. **Profile** — given seed entities (a crowd's favorites), what is this crowd's
   cultural fingerprint across music, food, places, brands, film, and more?
2. **Decide** — given a question in any domain, what are the grounded picks,
   with scores and a clickable evidence trail?
3. **Ship** — given a decision, draft the message in the right voice and
   execute it (publish to social, or schedule).

Nothing in that loop is hospitality-specific. "A café in Lagos" is the first
instantiation — the wedge. The agent, tools, evidence store, and publishing
pipeline work the moment you swap *who the crowd is*.

## The use-case map

Wherever an entity called "a crowd" exists, CrowdPilot applies.

| Audience | Their cultural decisions | Engine's role |
|---|---|---|
| **Hospitality & retail** *(current wedge)* | Stock, playlist, menu, decor, events, posts | Full loop — decide → create → ship |
| **Event organizers & promoters** | Lineups, themeing, city/venue choice, sponsor fit, promo | Profile the expected audience → program → promote |
| **Creators & influencers** | Content angles, collabs, brand partnerships | Audience profile → grounded calendar + partner shortlist |
| **Small brands / D2C** | Launch market, campaign references, creator matches | "Reality gap" check: assumed customer vs the data |
| **Agencies & marketers** | Culture briefs per client segment | Multi-profile briefs with evidence, white-labeled |
| **Tourism operators** | Itineraries matched to traveler segments | Cross-domain trips (food ↔ music ↔ places) |
| **Community & care orgs** | Programming that resonates with specific populations | Taste-matched programming with dignity guardrails |
| **Individuals** | Gifting, group plans, relocation, discovery | The consumer version — real, but a crowded market |

Demand signal: in a survey of ~95 hackathon registrations for this exact event,
the largest idea clusters *after* generic recommendations were precisely these
adjacencies — event programming, SMB marketing, brand/collab matching, and
care-context programming. Many teams hand-rolled vertical slices of this engine.
None built the horizontal one.

## What is (and isn't) hospitality-specific today

Structurally, almost nothing. The infrastructure — Qloo client, evidence store,
sessions, publishing, nix/infra pipeline — is fully horizontal. The
hospitality framing lives entirely in the **persona layer**:

- The demo persona ("Kofi's café, Lagos") — a config swap
- The agent's system prompt and question templates
- The domain list we profile (the `QlooEntityType` union already spans ten
  types: artist, brand, place, movie, tv_show, book, podcast, video_game,
  destination, person)

Adding "event organizer" or "creator" is a new persona plus two question
templates — not a new architecture.

## Honest edges (where CrowdPilot does not go)

- **No inventory-level truth.** We reason about categories ("your crowd
  over-indexes on specialty coffee"), not your actual SKU list. Businesses with
  rich internal data should fuse us *with* it, not replace it.
- **B2B without consumers.** A SaaS company's "crowd" doesn't live in a taste
  graph the same way.
- **Regulated and clinical contexts.** Care and health-adjacent programming is
  poignant and real, but demands clinical guardrails we won't fake.
- **Cultural sensitivity is a feature, not a filter.** Taste data encodes real
  communities; recommendations must respect that and cite their sources.

## Roadmap

- **V1 — independent hospitality & retail (this submission).** The validated
  wedge: Qloo's own enterprise market, self-serve.
- **V2 — creators & small brands.** Same engine, new persona: audience profiles,
  grounded content calendars, collab and partner matching.
- **V3 — agencies & event organizers.** Multi-profile briefs, programming
  planning, white-label deployments.
- **V4 — the engine as a platform.** Profile/Decide/Ship exposed as an API and
  MCP server, so any agent can be taste-grounded.

## Submission framing (Qloo Agentic Hackathon)

We demo the vertical (a Lagos café), we *state* the horizontal (the persona is a
config file), and the evidence trail proves the differentiator: every
recommendation is grounded in real taste data — **decisions with receipts, not
vibes**.

> Demo the café. Show the engine. Ship the post.
