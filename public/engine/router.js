import { EMEA, ENTERPRISE_MIN_EMPLOYEES, FIT_WEIGHTS, INTENT_WEIGHTS, NA, QUEUES, REQUIRED_FIELDS, RULES_VERSION, STALE_AFTER_DAYS, TIERS } from "./rules.js";

/** @typedef {import("./leads.js").Lead} Lead */
/** @typedef {keyof typeof QUEUES} QueueId */
/** @typedef {{ factor: string, value: string, points: number }} Line */
/** @typedef {{ step: number, rule: string, outcome: "fired" | "passed" | "skipped", detail: string }} TraceStep */

/** @param {{ min: number, tier: string }[]} bands @param {number} score */
const tierOf = (bands, score) => /** @type {{ tier: string }} */ (bands.find((b) => score >= b.min)).tier;

/** @param {string | null} country */
export function regionOf(country) {
  if (!country) return null;
  if (country === "GB") return "GB";
  if (EMEA.includes(country)) return "EMEA";
  if (NA.includes(country)) return "NA";
  return "OTHER";
}

/** @param {Lead} lead */
export function missingFields(lead) {
  return REQUIRED_FIELDS.filter((f) => lead[f] === null || lead[f] === "");
}

/** @param {Lead} lead */
export function scoreFit(lead) {
  /** @type {Line[]} */
  const lines = [];
  const band = lead.employees === null ? null : FIT_WEIGHTS.employees.find((b) => /** @type {number} */ (lead.employees) >= b.min);
  lines.push({ factor: "Company size", value: band ? band.label : "missing", points: band ? band.points : 0 });
  lines.push({ factor: "Buying team", value: lead.department ?? "missing", points: lead.department ? FIT_WEIGHTS.department[lead.department] : 0 });
  lines.push({ factor: "Seniority", value: lead.seniority ?? "missing", points: lead.seniority ? FIT_WEIGHTS.seniority[lead.seniority] : 0 });
  const focus = lead.industry !== null && FIT_WEIGHTS.focusIndustries.includes(lead.industry);
  lines.push({ factor: "Industry", value: lead.industry ?? "missing", points: lead.industry === null ? 0 : focus ? FIT_WEIGHTS.industry.focus : FIT_WEIGHTS.industry.other });
  const region = regionOf(lead.country);
  lines.push({ factor: "Region", value: region ?? "missing", points: region ? FIT_WEIGHTS.region[region] : 0 });
  const score = lines.reduce((s, l) => s + l.points, 0);
  return { score, tier: tierOf(TIERS.fit, score), lines };
}

/** @param {Lead} lead */
export function scoreIntent(lead) {
  const s = lead.signals;
  const w = INTENT_WEIGHTS;
  /** @type {Line[]} */
  const lines = [
    { factor: "Demo request", value: s.demoRequest ? "yes" : "no", points: s.demoRequest ? w.demoRequest : 0 },
    { factor: "Pricing page views", value: String(s.pricingViews), points: Math.min(s.pricingViews * w.pricingView.each, w.pricingView.cap) },
    { factor: "Content downloads", value: String(s.contentDownloads), points: Math.min(s.contentDownloads * w.contentDownload.each, w.contentDownload.cap) },
    { factor: "Webinar attended", value: s.webinarAttended ? "yes" : "no", points: s.webinarAttended ? w.webinarAttended : 0 },
    { factor: "Positive replies", value: String(s.positiveReplies), points: Math.min(s.positiveReplies * w.positiveReply.each, w.positiveReply.cap) },
  ];
  const raw = lines.reduce((t, l) => t + l.points, 0);
  const days = s.daysSinceLastActivity;
  const recency = days === null ? { multiplier: 0, label: "no engagement yet" } : /** @type {{ multiplier: number, label: string }} */ (w.recency.find((r) => days <= r.maxDays));
  const score = Math.min(100, Math.round(raw * recency.multiplier));
  return { score, raw, tier: tierOf(TIERS.intent, score), lines, recency };
}

/**
 * Score-only routing matrix (no guards). Used as the final step of `routeLead`
 * and on its own to show what an unguarded router would have done.
 * @param {Lead} lead @param {string} fitTier @param {string} intentTier
 * @returns {{ queue: QueueId, reason: string }}
 */
export function matrixRoute(lead, fitTier, intentTier) {
  const enterprise = (lead.employees ?? 0) >= ENTERPRISE_MIN_EMPLOYEES;
  if (fitTier === "A" && (intentTier === "Hot" || lead.signals.demoRequest)) return { queue: enterprise ? "enterprise_ae" : "midmarket_ae", reason: `Fit A + ${intentTier === "Hot" ? "Hot intent" : "demo request"} → ${enterprise ? "Enterprise" : "Mid-market"} AE (${enterprise ? "≥" : "<"}${ENTERPRISE_MIN_EMPLOYEES} employees)` };
  if (intentTier === "Hot") return { queue: "sdr_triage", reason: `Hot intent with Fit ${fitTier} → SDR triage so a live buyer is never dropped` };
  if (intentTier === "Warm" && fitTier !== "C") return { queue: "sdr_qualify", reason: `Fit ${fitTier} + Warm intent → SDR qualification` };
  if (fitTier === "A" && intentTier === "Cold") return { queue: "outbound_list", reason: "Fit A + Cold intent → outbound target list" };
  return { queue: "nurture", reason: `Fit ${fitTier} + ${intentTier} intent → marketing nurture` };
}

/**
 * Deterministic router. Guards run in a fixed order; the first guard that fires decides.
 * Every lead ends in exactly one queue with an owner role, SLA and reason.
 * @param {Lead} lead
 */
export function routeLead(lead) {
  const fit = scoreFit(lead);
  const intent = scoreIntent(lead);
  const missing = missingFields(lead);
  const s = lead.signals;
  /** @type {TraceStep[]} */
  const trace = [];
  /** @type {string[]} */
  const flags = [];
  /** @type {{ queue: QueueId, reason: string, guard: string | null } | null} */
  let decision = null;

  /** @param {string} rule @param {boolean} fires @param {string} detail @param {() => { queue: QueueId, reason: string }} [then] */
  const step = (rule, fires, detail, then) => {
    const n = trace.length + 1;
    if (decision) return trace.push({ step: n, rule, outcome: "skipped", detail: "An earlier rule already decided" });
    trace.push({ step: n, rule, outcome: fires ? "fired" : "passed", detail });
    if (fires && then) decision = { ...then(), guard: rule };
  };

  step("Consent", lead.consent === "opted_out" && !s.demoRequest, lead.consent === "opted_out" ? (s.demoRequest ? "Opted out of marketing, but asked for a demo: reply to the request only, no sequences" : "Opted out of marketing and made no direct request") : `Consent basis: ${lead.consent}`, () => ({ queue: "suppressed", reason: "Opted out of marketing: logged, never sequenced or called" }));
  if (lead.consent === "opted_out" && s.demoRequest) flags.push("reply-only: no sequences");
  step("Consent basis known for outbound", !decision && lead.direction === "outbound" && lead.consent === "unknown", lead.direction === "outbound" ? `Outbound lead, consent: ${lead.consent}` : "Inbound lead: basis captured at form fill", () => ({ queue: "consent_review", reason: "Outbound contact with no recorded lawful basis: hold before any sequence" }));
  step("Duplicate / existing account", lead.crmMatch !== null, lead.crmMatch ? `Matches an existing CRM account owned by ${lead.crmMatch.accountOwner}` : "No CRM account match on domain", () => ({ queue: "existing_owner", reason: "Existing account: route to its current owner instead of creating a second owner" }));
  if (lead.crmMatch) flags.push("merge into existing account");
  const liveBuyer = s.demoRequest || intent.tier === "Hot";
  step("Missing data", missing.length > 0, missing.length ? `Missing: ${missing.join(", ")}` : "All routing fields present", () => liveBuyer ? { queue: "sdr_triage", reason: "Live buyer with incomplete data: human triage now, enrich in parallel" } : { queue: "data_fix", reason: "Incomplete record with no live intent: enrich before scoring" });
  if (missing.length) flags.push(`enrich: ${missing.join(", ")}`);
  const days = s.daysSinceLastActivity;
  step("Stale engagement", days !== null && days > STALE_AFTER_DAYS && !s.demoRequest, days === null ? "No engagement yet" : `Last activity ${days} day${days === 1 ? "" : "s"} ago (stale after ${STALE_AFTER_DAYS})`, () => ({ queue: "nurture", reason: `No activity for ${days} days: re-engage via nurture, not an SDR call` }));
  const matrix = matrixRoute(lead, fit.tier, intent.tier);
  step("Fit × intent matrix", true, `Fit ${fit.score} (${fit.tier}) × intent ${intent.score} (${intent.tier})`, () => matrix);

  const d = /** @type {{ queue: QueueId, reason: string, guard: string | null }} */ (decision);
  const guard = d.guard === "Fit × intent matrix" ? null : d.guard;
  const q = QUEUES[d.queue];
  return {
    leadId: lead.id,
    rulesVersion: RULES_VERSION,
    fit,
    intent,
    missing,
    queue: d.queue,
    queueLabel: q.label,
    owner: d.queue === "existing_owner" && lead.crmMatch ? lead.crmMatch.accountOwner : q.owner,
    sla: q.sla,
    reason: d.reason,
    guard,
    flags,
    trace,
    unguarded: matrix,
    guardChangedOutcome: matrix.queue !== d.queue,
  };
}

/** @param {Lead[]} leads */
export function routeAll(leads) {
  return leads.map((lead) => ({ lead, result: routeLead(lead) }));
}
