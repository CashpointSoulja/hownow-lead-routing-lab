# Five whys: why do qualified leads stall or reach the wrong owner?

> **Independent concept by Ayo Ahmed; not affiliated with HowNow. Synthetic data only.** Only the first line is from HowNow (S1 in the [PRD](PRD.md)). Every answer below is an **assumption** with a test attached. I have no access to HowNow's HubSpot or pipeline.

**Known (S1):** HowNow wants every inbound and outbound lead scored and routed by fit and intent, wants to see "where deals stall", and treats HubSpot as the system of record.

| Why? | Assumed answer | How to check (cheap) |
|---|---|---|
| 1. Why might a qualified lead stall? | It is routed to a queue nobody works, or to nobody, or to the wrong person who does not pass it on. | HubSpot report: contacts created in 90 days, grouped by owner (including none) and first-activity delay. |
| 2. Why would routing send it there? | Routing looks at one dimension (a lifecycle stage or a single score) instead of fit **and** intent, and has no explicit rule for edge cases. | Read the current workflows; list every branch and the leads that fall through none. |
| 3. Why are edge cases not handled? | Consent, duplicates, missing fields and stale records are handled in different tools or by hand, not in one ordered rule set. | Map where each check lives today (forms, enrichment, sequencer, HubSpot workflows). |
| 4. Why is it spread out? | Rules were added as each tool arrived, without a single owner, test cases or a changelog. | Ask Sales and Marketing: "who changes routing, and how do you know it still works?" |
| 5. Why does nobody notice? | There is no routing telemetry: no event for "routed", "accepted", "SLA breached" or "reassigned", so stalls look like normal pipeline. | Check whether these can be reported today. If not, that is the first thing to build. |

## Root cause (hypothesis)

Routing is **implicit and unobservable**: rules live in several places, edge cases have no explicit branch, and nothing measures a lead from creation to first touch.

## What the lab does about it

- Puts every guard in one ordered list, with a trace per lead.
- Makes edge cases explicit branches with a named owner (including "Suppressed" and "Data fix") so nothing falls through.
- Defines the events ([EVENT_TAXONOMY.md](EVENT_TAXONOMY.md)) that would make stalls visible.

## What would prove this wrong

If the HubSpot report in step 1 shows nearly every lead touched within SLA by the right owner, the pain is elsewhere (for example conversion after first touch), and this project should shrink to telemetry only.
