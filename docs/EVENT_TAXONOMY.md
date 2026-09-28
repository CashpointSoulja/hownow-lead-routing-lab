# Event taxonomy

> **Independent concept by Ayo Ahmed; not affiliated with HowNow. Synthetic data only.** In the lab, events are emitted in the browser and validated live on the Events tab; nothing is sent anywhere.

## Principles

1. **No personal data.** Properties are lead ids, enums, numbers and booleans. No names, emails, phones, company names, URLs or free text. The validator rejects anything that looks like an email, phone number or URL, and any property not in the schema.
2. **Rules are versioned.** Every score and route carries `rules_version`, so a change in outcomes can be tied to a change in rules.
3. **Guards are first-class.** `lead_routed.guard` names the guard that decided (or null for the matrix), and `guard_changed_outcome` says whether score alone would have routed differently.
4. **Production-only events are named now,** so the reporting in [EXPERIMENT_DESIGN.md](EXPERIMENT_DESIGN.md) can be built on day one.

## Mapping to HubSpot (proposal, not built)

Scores and the routing decision would be contact properties (`fit_score`, `fit_tier`, `intent_score`, `intent_tier`, `routing_queue`, `routing_guard`, `routing_rules_version`); events would be HubSpot custom events or timeline events. Property names are placeholders to agree with RevOps.

## Events

Generated from `public/engine/taxonomy.js` by `npm run docs:taxonomy`; a test fails if this section drifts.

<!-- events:start -->

### `lead_scored`

Fit and intent are (re)computed for a lead. Emitted live in the lab.

| Property | Type |
|---|---|
| `lead_id` | id |
| `rules_version` | enum: `v0.1-synthetic` |
| `fit_score` | number |
| `fit_tier` | enum: `A`, `B`, `C` |
| `intent_score` | number |
| `intent_tier` | enum: `Hot`, `Warm`, `Cold` |

### `lead_routed`

The router assigns a queue (first route or re-route). Emitted live in the lab.

| Property | Type |
|---|---|
| `lead_id` | id |
| `rules_version` | enum: `v0.1-synthetic` |
| `queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |
| `guard` | enum: `Consent`, `Consent basis known for outbound`, `Duplicate / existing account`, `Missing data`, `Stale engagement` (nullable) |
| `guard_changed_outcome` | boolean |
| `sla_minutes` | number (nullable) |

### `route_changed`

A signal or consent edit moves a lead to a different queue. Emitted live in the lab.

| Property | Type |
|---|---|
| `lead_id` | id |
| `from_queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |
| `to_queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |

### `signal_edited`

Someone edits an engagement signal or consent value in the lab. Emitted live in the lab.

| Property | Type |
|---|---|
| `lead_id` | id |
| `field` | enum: `demoRequest`, `pricingViews`, `contentDownloads`, `webinarAttended`, `positiveReplies`, `daysSinceLastActivity`, `consent` |

### `lead_accepted`

The owner accepts the lead in the CRM (production only). Not emitted in the lab: needs a real CRM.

| Property | Type |
|---|---|
| `lead_id` | id |
| `queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |
| `minutes_to_accept` | number |

### `sla_breached`

A routed lead passes its SLA without a first touch (production only). Not emitted in the lab: needs a real CRM.

| Property | Type |
|---|---|
| `lead_id` | id |
| `queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |
| `minutes_over` | number |

### `lead_reassigned`

A human moves a lead to another owner (production only). Not emitted in the lab: needs a real CRM.

| Property | Type |
|---|---|
| `lead_id` | id |
| `from_queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |
| `to_queue` | enum: `enterprise_ae`, `midmarket_ae`, `existing_owner`, `sdr_triage`, `sdr_qualify`, `outbound_list`, `consent_review`, `data_fix`, `nurture`, `suppressed` |
| `reason` | enum: `wrong_segment`, `wrong_region`, `existing_owner`, `capacity`, `other` |

<!-- events:end -->
