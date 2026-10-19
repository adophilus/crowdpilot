# CrowdPilot — Product Spec

## Problem

A small business owner (café, bar, boutique) makes cultural decisions on gut feel: what music to play, what to stock, what to post. Generic LLMs give generic answers — they don't know what this owner's *crowd* actually loves. And even a good advice doc doesn't get the post published.

## Product

A chat co-pilot. In one conversation the owner goes from "this is my business and my crowd" to a culturally-grounded decision + a post about it, live on their social accounts.

## Core loop

1. **Onboard (2 min):** owner picks business type + city, then names a few things their crowd loves (search-backed entity/tag picker). CrowdPilot builds a **taste profile** via Qloo: audience tags, cross-domain affinities (music / food / places / brands).
2. **Decide:** ask the co-pilot what to do — "what should I play this weekend?" "what should I stock?" "any events worth sponsoring?" Answers cite Qloo evidence (affinity scores, tags, local heatmaps).
3. **Create:** "draft a post for IG/X about it" — platform-aware drafts, each citing the Qloo grounding behind the angle ("your crowd over-indexes on X, so…").
4. **Ship:** one click → publish via Onscript to connected X/IG/FB accounts. Scheduled posts = stretch.

## Features

| Prio | Feature | Notes |
|---|---|---|
| P0 | Taste-profile builder (entities + tags → Qloo profile card) | The product's brain; profile is reusable across chats |
| P0 | Chat agent with Qloo tools (decide + create) | Every answer cites Qloo evidence |
| P0 | Publish via Onscript (X, IG, FB) | Demo account pre-connected; image posts via Cloudinary if cheap |
| P0 | Side-by-side panel: LLM-only vs Qloo-grounded answer | Table stakes in this field — ~5 competitors promise it |
| P1 | "What's happening" feed: trending artists, new spots nearby, events to ride | Qloo-native alerts; the pitch's 4th clause |
| P1 | Preloaded demo persona ("try as demo café") | Judges must reach wow in <60s, no signup |
| P2 | Scheduled posts (Onscript SCHEDULED) | "Runs your week while you sleep" |
| P2 | Voice input | Pitch flourish; only if days to spare |

## Demo script (judge flow, target 3 min)

1. Land on page → click **"Try the demo café"** → profile card assembles live from Qloo calls (music/food/places/brands affinities for the crowd).
2. Ask: "what should I play this weekend?" → answer + cited evidence. Flip the **with/without Qloo** toggle → generic answer visible.
3. Ask: "draft an IG post about Saturday" → draft with grounding note → **Publish** → show the live post on the real connected account.
4. Open "what's happening near me" → trending artists + events worth sponsoring, with links.

## Judging-criteria mapping

- **Technological implementation:** non-trivial Qloo use — multi-domain insights, tags, geo, explainability on every call; real publishing pipeline via Onscript.
- **Design:** complete product loop decide→create→ship, not a PoC; demo persona for instant start.
- **Potential impact:** SMEs are Qloo's real market; self-serve version of an enterprise capability.
- **Quality of idea:** the field's advisors stop at advice; we execute. "The one that ships."

## Out of scope (do not build)

- Onscript code changes (feature-flagged service-token path: only if auth blocks demo — last resort)
- Multi-tenant auth / user accounts beyond demo persona + owner session
- Analytics, follower data, engagement metrics (Qloo has none; don't fake it)
- RSVP/events marketplace, inventory systems, payments
- Mobile apps; i18n beyond EN
- Brand-new infra for Onscript (use existing staging deployment as a service)

## Personas

- **Primary:** owner of an independent café/bar/boutique, 1 location, runs their own socials.
- **Demo persona:** "Kofi's café in Lagos" (verify Qloo place coverage for Lagos on key arrival; fallback: NYC coffee bar — coverage guaranteed).
