# Experiment design: does explicit, guarded routing reduce stalls and misroutes?

> **Independent concept by Ayo Ahmed; not affiliated with HowNow. Synthetic data only.** There are no baselines, rates or results here. Every number in a real test would come from HowNow's own data.

## Hypothesis

If every lead goes through one ordered set of guards and a fit × intent matrix, with a named owner and SLA, then **more Fit A/B Hot leads get a first touch within SLA**, with **fewer reassignments**, and **no opted-out contact is sequenced**.

## Design: shadow first, then split

1. **Shadow (2 weeks, zero risk).** Run the new router alongside current routing. It writes `shadow_queue` and `shadow_guard` to each new lead but assigns nothing. Compare decisions daily. Every disagreement is reviewed with Sales: which was right?
2. **Split (4–6 weeks, if shadow looks sound).** Randomise **by lead id hash** (50/50) for new leads *outside* the guard paths. Guards (consent, existing owner) apply to both arms from day one, because they are rules of safety, not the thing being tested.
3. **Randomising by lead, not by rep,** keeps rep quality balanced. Check sample ratio (50/50 split within tolerance) before reading results.

## Metrics

| Type | Metric | Definition |
|---|---|---|
| Primary | Speed to first touch, Fit A/B Hot | Median minutes from `lead_routed` to first logged call/email/meeting |
| Secondary | Within-SLA rate | Share of routed leads with first touch before SLA |
| Secondary | Misroute rate | Share of leads with `lead_reassigned` within 7 days |
| Secondary | Stall count | Leads past SLA with no touch (`sla_breached`), by queue |
| Guardrail (must be zero) | Opted-out contacts sequenced | Any contact with `consent = opted_out` enrolled in a sequence |
| Guardrail | Rep load | Leads per rep per day does not exceed an agreed cap |
| Guardrail | Pipeline created | Opportunities per 100 leads does not fall (checked at 30 and 60 days) |

## Decision rules (agreed before starting)

- **Ship** if the primary metric improves, misroutes do not rise, and every guardrail holds.
- **Iterate** if disagreements in shadow cluster on one rule: change that rule, re-shadow a week.
- **Stop** if any opted-out contact is sequenced by the new router, or pipeline created falls in the new arm.

## Segments to read (not to fish in)

Inbound vs outbound; enterprise vs mid-market; UK vs rest of world. Declared up front.

## Risks

Low volume can make a split underpowered: then keep shadow mode and use per-lead review instead of a statistical test. Sales may override routes by hand: track that with `lead_reassigned.reason` rather than hiding it.
