# Validation plan: what to check before trusting any rule

> **Independent concept by Ayo Ahmed; not affiliated with HowNow. Synthetic data only.** Nothing here has been run. Each step names the data it needs and the result that would change the rules.

## Week 1: is the pain real?

| Check | Data needed | Changes the plan if… |
|---|---|---|
| Unowned or late leads | HubSpot: contacts created in 90 days, owner, first activity date | Nearly all are touched in SLA by the right owner → shrink to telemetry only |
| Reassignments | Owner-change history | Few reassignments → the duplicate guard matters less |
| Opted-out in sequences | Sequence enrolments joined to subscription status | Any found → consent guard is the first thing to ship |
| Duplicates | Contacts per domain vs companies | High rate → build duplicate matching before scoring |

## Week 2: calibrate the scores

1. Export closed-won and closed-lost deals from the last 12–18 months with their company size, industry, region, buying team and seniority.
2. For each fit factor, compare win rate by band. **Keep a factor only if it separates wins from losses.** Re-weight by observed difference, rounded so a human can still read it.
3. For intent, compare touch-to-meeting rates by signal (demo request, pricing, webinar, replies) and by days since last activity. Set the recency multipliers and the stale cutoff from the drop-off.
4. Replay the last 90 days of leads through the router. Every lead whose new route differs from what happened is a review item with Sales.

## Week 3: agree the operating rules

- SLAs per queue with Sales leadership (the lab's are proposals).
- Who owns Consent review and Data fix, and their SLA.
- Enterprise / mid-market split (the lab assumes 1,000 employees).
- Change control: rules in version control, a test per branch, `rules_version` on every event.

## Kill criteria

Stop and rethink if replay shows the fit score does not separate won from lost deals better than company size alone, or if Sales rejects more than a small share of shadow routes in review for the same reason twice.
