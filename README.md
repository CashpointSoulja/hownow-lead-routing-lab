# Lead Routing Lab: No Lead Left Behind

**Live demo:** https://hownow-lead-routing-lab.ayomideahmedcp.workers.dev/ · [PRD](docs/PRD.md)

> **Independent concept by Ayo Ahmed; not affiliated with HowNow. Synthetic data only.**
> An audition piece for HowNow's [GTM Engineer (Hybrid, UK)](https://careers.gethownow.com/jobs/8258068-gtm-engineer-hybrid-uk) role. It is not HowNow's product, code or data. No HubSpot connection, no outreach, no real leads, no metrics.

## The question

The job post asks for "the automated infrastructure that scores and routes every lead, inbound and outbound, by fit and intent" (Project: No Lead Left Behind). The business pain is a **qualified lead that stalls or reaches the wrong owner**. This is the smallest honest proof of a router that prevents it: every score is readable, every route is one ordered trace, and every lead ends with exactly one owner, SLA and reason.

## What's in it

- **Eight synthetic leads** on reserved `.example` domains, chosen so each guard and matrix branch fires at least once. No names, emails or phone numbers.
- **Fit (0–100):** company size, buying team, seniority, industry, region. **Intent (0–100):** demo request, pricing views, downloads, webinar, positive replies, times a recency multiplier.
- **Deterministic routing** with guards in a fixed order: consent → consent basis for outbound → duplicate / existing account → missing data → stale engagement → fit × intent matrix.
- **Search and filters** by text, direction, queue, guard, fit tier and intent tier.
- **Editable engagement signals and consent**: change one and the lead re-scores and re-routes, with a note when its queue moves.
- **"Score alone would have…"**: each lead shows where an unguarded matrix would have sent it, so you can see what each guard prevented.
- **Rules tab** rendered from the engine's own weight tables. **Events tab** with a live, privacy-checking validator and JSON download. **Docs tab** served by the Worker.

| Lead | Path it exercises | Route |
|---|---|---|
| L01 Northwind Rail | Fit A + Hot, 4,200 employees | Enterprise AE pod |
| L02 Brightwell Bank | Outbound reply from an existing account | Existing account owner |
| L03 Pellucid Health | Fit A + Warm | SDR qualification |
| L04 Kitebox | Hot demo request, low fit | SDR triage (not nurture) |
| L05 Oakridge Borough Council | High fit, 140 days inactive | Marketing nurture (stale guard) |
| L06 Vantage Retail Group | High fit, opted out of marketing | Suppressed: do not contact |
| L07 Fernlea Studio | Demo request, missing size/industry/seniority | SDR triage + enrich |
| L08 Meridian Logistics | Outbound list build, consent unknown | Consent review |

## Documents

- [PRD](docs/PRD.md), including the honest fit gaps
- [Five whys](docs/FIVE_WHYS.md)
- [Event taxonomy](docs/EVENT_TAXONOMY.md)
- [Experiment design](docs/EXPERIMENT_DESIGN.md)
- [Validation plan](docs/VALIDATION_PLAN.md)
- [Decision makers](docs/DECISION_MAKERS.md)

## Honesty rules

1. **Cited or assumed.** HowNow facts cite a public page (job post, homepage, About page). Every weight, threshold, queue and SLA is an assumption to calibrate with HowNow's own won/lost data.
2. **No numbers pretending to be results.** No baselines, conversion rates or uplift anywhere.
3. **Owners are roles, not people.** Only people named on HowNow's public pages appear, in [Decision makers](docs/DECISION_MAKERS.md), with sources.
4. **Fit gaps stated.** I have not shown deep HubSpot administration, SQL at depth, 2+ years in dedicated GTM engineering, or end-to-end GTM stack ownership.

## Run locally

Requires Node 20+.

```bash
npm install
npm run dev          # wrangler dev → http://localhost:8787
npm test             # vitest: engine, guards, taxonomy, docs, worker, UI contract
npm run typecheck    # tsc --noEmit
npm run docs:taxonomy  # regenerate the events section of docs/EVENT_TAXONOMY.md
```

## Architecture

- `public/engine/`: dependency-free ES modules shared by the browser, the Worker and the tests.
  - `leads.js` the eight synthetic leads · `rules.js` weights, tiers, queues, SLAs · `router.js` `scoreFit`, `scoreIntent`, `routeLead` · `taxonomy.js` events and `validateEvent`
- `public/app.js`, `index.html`, `style.css`: the UI (no framework). `public/vendor/marked.esm.js`: Markdown renderer (MIT).
- `src/worker.ts`: Cloudflare Worker serving static assets plus `/api/health`, `/api/routes` and `/api/docs/:slug`. No storage, no secrets, no outbound calls.

## Deployment

Live on Cloudflare Workers at https://hownow-lead-routing-lab.ayomideahmedcp.workers.dev/ (health check: [`/api/health`](https://hownow-lead-routing-lab.ayomideahmedcp.workers.dev/api/health)). Deployed through Cloudflare's Git integration, which rebuilds from `main` on push (config in `wrangler.jsonc`). The Worker is static assets plus read-only JSON endpoints: no storage, no secrets, no HubSpot or other external integration, synthetic data only. `npm run deploy` also works from an authenticated Wrangler.

## Brand

HowNow's public palette (coral `#ff4f56`, navy `#243053`) and pill buttons. HowNow's typefaces are commercial, so the lab uses the system font stack. The HowNow wordmark appears once, in the header, labelled "Concept about … Independent · Not affiliated · No endorsement". HowNow and its logo belong to their owner.

## Licence

MIT for the code. The HowNow wordmark is not covered by the licence.
