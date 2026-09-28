# PRD: No Lead Left Behind, routing lab

> **Independent concept by Ayo Ahmed; not affiliated with HowNow. Synthetic data only.** No HubSpot connection, no outreach, no real leads or metrics. Everything described as HowNow fact cites a public page (S1–S3 below); everything else is an assumption.

## Sources (public, accessed 28 Sep 2026)

| # | Source | What it says |
|---|---|---|
| S1 | [GTM Engineer, Hybrid (UK) job post](https://careers.gethownow.com/jobs/8258068-gtm-engineer-hybrid-uk) | Posted by Duncan, Head of GTM. The role owns "the systems that put the right accounts in front of the right people", "ensure every lead is scored and routed properly", and HubSpot "as our system of record". Project *No Lead Left Behind*: "the automated infrastructure that scores and routes every lead, inbound and outbound, by fit and intent". Also: see "where deals stall". £50–62K base, 10% discretionary bonus; hybrid, London office twice a week. |
| S2 | [gethownow.com](https://www.gethownow.com/) | AI-enabled learning and skills platform. |
| S3 | [gethownow.com/about](https://www.gethownow.com/about) | Structured team data lists Nelson Sivalingam (Co-founder & CEO), Kuvera Sivalingam (Co-founder & COO), Ashish Kumar (Co-founder & CTO) and Harvey Stead (SDR Manager). |

## Problem

S1 names the job: every lead, inbound and outbound, scored and routed by fit and intent. The pain this lab targets is the failure mode that job implies: **a qualified lead stalls, or reaches the wrong owner.** I have no HowNow data, so I do not know how often this happens today. The five whys ([FIVE_WHYS.md](FIVE_WHYS.md)) separate what is known from what is assumed.

Concrete ways a lead is "left behind" (assumed, typical of B2B SaaS routing):

1. A hot lead from a smaller or unusual company scores low on fit and drops into nurture.
2. A reply from an existing account creates a second owner.
3. A lead with missing firmographics sits unrouted because the score cannot be computed.
4. A contact who opted out gets sequenced because the score said "hot".
5. An old, cold record is called by an SDR while fresh leads wait.

## Users

| User | Needs |
|---|---|
| SDRs and AEs | One clear owner and SLA per lead, with a reason they can trust |
| Marketing | Leads they generate are not lost or mis-sent; nurture gets the right leads |
| RevOps / GTM Engineer | Rules that are readable, testable and changeable without breaking something else |
| Head of GTM | Evidence that routing works: speed to first touch, misroutes, stalls |

## What the lab proves (and what it does not)

It proves a **small, deterministic, explainable router** is possible and inspectable: every score is a sum of visible lines, every route is one ordered trace, every lead ends in exactly one queue. It does **not** prove the weights are right for HowNow, that the SLAs are achievable, or that this would beat whatever HowNow runs today.

## Scope

- 8 synthetic leads (6 inbound, 2 outbound) chosen to exercise every guard and matrix branch.
- **Fit (0–100):** company size, buying team, seniority, industry, region.
- **Intent (0–100):** demo request, pricing views, downloads, webinar, positive replies, times a recency multiplier.
- **Guards, in order:** consent → consent basis for outbound → duplicate / existing account → missing data → stale engagement → fit × intent matrix.
- **UI:** search and filters (direction, queue, guard, fit tier, intent tier), lead detail with score breakdowns and trace, editable engagement signals and consent that re-route instantly, a "score alone would have…" comparison, rule tables read from the engine, live-validated events.
- **Worker API:** `/api/health`, `/api/routes`, `/api/docs`.

Out of scope: HubSpot sync, enrichment vendors, ML scoring, round-robin capacity balancing, real SLA timers.

## Requirements

| # | Requirement | How the lab meets it |
|---|---|---|
| R1 | Every lead gets exactly one queue, one owner role, one SLA and one reason | `routeLead` always returns one decision; tested for all 8 leads and random edits |
| R2 | Consent is checked before anything else | Consent is guard 1; opted-out leads are never in a sequence queue (tested) |
| R3 | Existing accounts keep their owner | Duplicate guard routes to the CRM owner and flags a merge |
| R4 | Missing data never strands a live buyer | Missing data + demo request or Hot → SDR triage with an enrichment flag; otherwise Data fix |
| R5 | Stale records do not consume SDR time | Over 90 days inactive, no demo request → nurture |
| R6 | A hand-raiser is never nurtured by the matrix | Fit A with a demo request → AE even if not yet Hot; Hot with Fit B/C → SDR triage |
| R7 | Scores are explainable | Every point is a visible line; rules page renders the engine's own tables |
| R8 | Routing is observable without personal data | Events carry ids, enums, numbers, booleans only; validator rejects emails, phones, URLs |

## Success measures (for a real pilot, not claimed here)

Defined in [EXPERIMENT_DESIGN.md](EXPERIMENT_DESIGN.md): time to first touch for Fit A/B Hot leads, misroute rate (reassignments), leads older than SLA with no touch, and zero opted-out contacts sequenced.

## Assumptions to validate

Every weight, threshold, tier boundary, queue and SLA. The focus industries and 1,000-employee enterprise split are guesses from HowNow's public customer list, not from HowNow's pipeline. [VALIDATION_PLAN.md](VALIDATION_PLAN.md) lists how to test each one.

## Honest fit gaps (the builder)

This lab is a small proof, not a track record. For the role in S1, I (Ayo) have **not** shown:

- deep, production HubSpot administration (workflows, lists, reporting at scale);
- SQL at depth against a real GTM warehouse;
- two or more years in a dedicated GTM engineering role;
- end-to-end ownership of a GTM tech stack (choosing, integrating, retiring tools).

What the lab does show is the thinking and the build habits: explicit guard ordering, testable rules, privacy-safe events, and a plan to calibrate against real data before trusting any number.
