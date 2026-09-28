import { QUEUES, RULES_VERSION } from "./rules.js";

// Routing events. Properties are ids, enums, numbers and booleans only:
// no names, emails, phone numbers, company names or free text.

const QUEUE_IDS = Object.keys(QUEUES);
const GUARDS = ["Consent", "Consent basis known for outbound", "Duplicate / existing account", "Missing data", "Stale engagement"];
const EDITABLE = ["demoRequest", "pricingViews", "contentDownloads", "webinarAttended", "positiveReplies", "daysSinceLastActivity", "consent"];

/** @typedef {{ type: "id" | "number" | "boolean" | "enum", values?: string[], nullable?: boolean }} Prop */
/** @typedef {{ name: string, when: string, emittedInLab: boolean, props: Record<string, Prop> }} EventDef */

const leadId = /** @type {Prop} */ ({ type: "id" });
const queue = /** @type {Prop} */ ({ type: "enum", values: QUEUE_IDS });

/** @type {EventDef[]} */
export const EVENTS = [
  {
    name: "lead_scored",
    when: "Fit and intent are (re)computed for a lead",
    emittedInLab: true,
    props: { lead_id: leadId, rules_version: { type: "enum", values: [RULES_VERSION] }, fit_score: { type: "number" }, fit_tier: { type: "enum", values: ["A", "B", "C"] }, intent_score: { type: "number" }, intent_tier: { type: "enum", values: ["Hot", "Warm", "Cold"] } },
  },
  {
    name: "lead_routed",
    when: "The router assigns a queue (first route or re-route)",
    emittedInLab: true,
    props: { lead_id: leadId, rules_version: { type: "enum", values: [RULES_VERSION] }, queue, guard: { type: "enum", values: GUARDS, nullable: true }, guard_changed_outcome: { type: "boolean" }, sla_minutes: { type: "number", nullable: true } },
  },
  {
    name: "route_changed",
    when: "A signal or consent edit moves a lead to a different queue",
    emittedInLab: true,
    props: { lead_id: leadId, from_queue: queue, to_queue: queue },
  },
  {
    name: "signal_edited",
    when: "Someone edits an engagement signal or consent value in the lab",
    emittedInLab: true,
    props: { lead_id: leadId, field: { type: "enum", values: EDITABLE } },
  },
  {
    name: "lead_accepted",
    when: "The owner accepts the lead in the CRM (production only)",
    emittedInLab: false,
    props: { lead_id: leadId, queue, minutes_to_accept: { type: "number" } },
  },
  {
    name: "sla_breached",
    when: "A routed lead passes its SLA without a first touch (production only)",
    emittedInLab: false,
    props: { lead_id: leadId, queue, minutes_over: { type: "number" } },
  },
  {
    name: "lead_reassigned",
    when: "A human moves a lead to another owner (production only)",
    emittedInLab: false,
    props: { lead_id: leadId, from_queue: queue, to_queue: queue, reason: { type: "enum", values: ["wrong_segment", "wrong_region", "existing_owner", "capacity", "other"] } },
  },
];

const ID = /^L\d{2}$/;
const PII = [/@/, /\+?\d[\d\s-]{8,}/, /https?:\/\//i];

/**
 * @param {{ name: string, props: Record<string, unknown> }} event
 * @returns {string[]} errors; empty when valid
 */
export function validateEvent(event) {
  const def = EVENTS.find((e) => e.name === event.name);
  if (!def) return [`unknown event: ${event.name}`];
  /** @type {string[]} */
  const errors = [];
  for (const key of Object.keys(event.props)) if (!(key in def.props)) errors.push(`unexpected property: ${key}`);
  for (const [key, p] of Object.entries(def.props)) {
    const v = event.props[key];
    if (v === undefined) { errors.push(`missing property: ${key}`); continue; }
    if (v === null) { if (!p.nullable) errors.push(`${key} cannot be null`); continue; }
    if (typeof v === "string" && PII.some((re) => re.test(v))) { errors.push(`${key} looks like personal data`); continue; }
    if (p.type === "id" && !(typeof v === "string" && ID.test(v))) errors.push(`${key} must be a lead id like L01`);
    if (p.type === "number" && !(typeof v === "number" && Number.isFinite(v))) errors.push(`${key} must be a number`);
    if (p.type === "boolean" && typeof v !== "boolean") errors.push(`${key} must be a boolean`);
    if (p.type === "enum" && !(typeof v === "string" && p.values?.includes(v))) errors.push(`${key} must be one of: ${p.values?.join(", ")}`);
  }
  return errors;
}

/**
 * @param {ReturnType<typeof import("./router.js").routeLead>} r
 */
export function eventsForRoute(r) {
  return [
    { name: "lead_scored", props: { lead_id: r.leadId, rules_version: r.rulesVersion, fit_score: r.fit.score, fit_tier: r.fit.tier, intent_score: r.intent.score, intent_tier: r.intent.tier } },
    { name: "lead_routed", props: { lead_id: r.leadId, rules_version: r.rulesVersion, queue: r.queue, guard: r.guard, guard_changed_outcome: r.guardChangedOutcome, sla_minutes: QUEUES[r.queue].slaMinutes } },
  ];
}
