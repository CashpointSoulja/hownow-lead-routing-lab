// Transparent, deterministic scoring and routing. Every weight below is an
// assumption to be calibrated with HowNow's own closed-won data (see docs/VALIDATION_PLAN.md).

export const RULES_VERSION = "v0.1-synthetic";

export const FIT_WEIGHTS = {
  employees: [
    { min: 1000, points: 30, label: "1,000+ employees" },
    { min: 250, points: 25, label: "250–999 employees" },
    { min: 100, points: 15, label: "100–249 employees" },
    { min: 0, points: 0, label: "Under 100 employees" },
  ],
  department: { learning: 25, people: 25, enablement: 15, other: 0 },
  seniority: { exec: 20, head: 20, manager: 12, ic: 5 },
  focusIndustries: ["financial_services", "technology", "retail", "transport", "public_sector", "life_sciences", "logistics"],
  industry: { focus: 15, other: 5 },
  region: { GB: 10, EMEA: 8, NA: 6, OTHER: 4 },
};

export const EMEA = ["DE", "FR", "NL", "IE", "ES", "IT", "BE", "SE", "DK", "NO", "FI", "PL", "PT", "AT", "CH", "AE", "ZA"];
export const NA = ["US", "CA"];

export const INTENT_WEIGHTS = {
  demoRequest: 40,
  pricingView: { each: 8, cap: 24 },
  contentDownload: { each: 5, cap: 15 },
  webinarAttended: 10,
  positiveReply: { each: 12, cap: 24 },
  recency: [
    { maxDays: 7, multiplier: 1, label: "active in last 7 days" },
    { maxDays: 30, multiplier: 0.7, label: "active 8–30 days ago" },
    { maxDays: 90, multiplier: 0.4, label: "active 31–90 days ago" },
    { maxDays: Infinity, multiplier: 0, label: "no activity for 90+ days" },
  ],
};

export const TIERS = {
  fit: [{ min: 70, tier: "A" }, { min: 45, tier: "B" }, { min: 0, tier: "C" }],
  intent: [{ min: 60, tier: "Hot" }, { min: 30, tier: "Warm" }, { min: 0, tier: "Cold" }],
};

export const STALE_AFTER_DAYS = 90;
export const ENTERPRISE_MIN_EMPLOYEES = 1000;
export const REQUIRED_FIELDS = /** @type {const} */ (["domain", "title", "seniority", "department", "employees", "industry", "country"]);

/** Queues are roles, not people. SLAs are proposals, not HowNow commitments. */
export const QUEUES = {
  enterprise_ae: { label: "Enterprise AE pod", owner: "Enterprise AE (round robin)", sla: "1 business hour", slaMinutes: 60 },
  midmarket_ae: { label: "Mid-market AE pod", owner: "Mid-market AE (round robin)", sla: "1 business hour", slaMinutes: 60 },
  existing_owner: { label: "Existing account owner", owner: "Current CRM account owner", sla: "4 business hours", slaMinutes: 240 },
  sdr_triage: { label: "SDR triage", owner: "SDR on shift", sla: "2 business hours", slaMinutes: 120 },
  sdr_qualify: { label: "SDR qualification", owner: "SDR (round robin)", sla: "1 business day", slaMinutes: 480 },
  outbound_list: { label: "Outbound target list", owner: "SDR outbound sequence", sla: "Next sequence batch", slaMinutes: null },
  consent_review: { label: "Consent review", owner: "RevOps / GTM Engineer", sla: "1 business day", slaMinutes: 480 },
  data_fix: { label: "Data fix", owner: "RevOps / GTM Engineer", sla: "1 business day", slaMinutes: 480 },
  nurture: { label: "Marketing nurture", owner: "Marketing automation", sla: "Next nurture send", slaMinutes: null },
  suppressed: { label: "Suppressed: do not contact", owner: "Nobody (logged, no outreach)", sla: "None", slaMinutes: null },
};
