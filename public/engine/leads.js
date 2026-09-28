// Eight entirely synthetic leads. Companies, domains and roles are invented;
// `.example` domains are reserved and cannot belong to a real organisation.
// No names, emails or phone numbers are stored.

export const AS_OF = "2026-09-28";

/** @typedef {"granted" | "legitimate_interest" | "opted_out" | "unknown"} Consent */

/**
 * @typedef {object} Signals
 * @property {boolean} demoRequest
 * @property {number} pricingViews
 * @property {number} contentDownloads
 * @property {boolean} webinarAttended
 * @property {number} positiveReplies
 * @property {number | null} daysSinceLastActivity null when there has been no engagement yet
 */

/**
 * @typedef {object} Lead
 * @property {string} id
 * @property {string} company
 * @property {string | null} domain
 * @property {string | null} title
 * @property {"exec" | "head" | "manager" | "ic" | null} seniority
 * @property {"learning" | "people" | "enablement" | "other" | null} department
 * @property {number | null} employees
 * @property {string | null} industry
 * @property {string | null} country
 * @property {"inbound" | "outbound"} direction
 * @property {string} source
 * @property {Consent} consent
 * @property {{ accountOwner: string } | null} crmMatch
 * @property {Signals} signals
 */

/** @type {Lead[]} */
export const LEADS = [
  {
    id: "L01",
    company: "Northwind Rail",
    domain: "northwind-rail.example",
    title: "Head of Learning & Development",
    seniority: "head",
    department: "learning",
    employees: 4200,
    industry: "transport",
    country: "GB",
    direction: "inbound",
    source: "demo_request_form",
    consent: "granted",
    crmMatch: null,
    signals: { demoRequest: true, pricingViews: 2, contentDownloads: 1, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: 1 },
  },
  {
    id: "L02",
    company: "Brightwell Bank",
    domain: "brightwell-bank.example",
    title: "VP People",
    seniority: "exec",
    department: "people",
    employees: 1800,
    industry: "financial_services",
    country: "GB",
    direction: "outbound",
    source: "outbound_sequence_reply",
    consent: "legitimate_interest",
    crmMatch: { accountOwner: "Enterprise AE (existing account owner)" },
    signals: { demoRequest: false, pricingViews: 1, contentDownloads: 0, webinarAttended: false, positiveReplies: 1, daysSinceLastActivity: 4 },
  },
  {
    id: "L03",
    company: "Pellucid Health",
    domain: "pellucid-health.example",
    title: "L&D Manager",
    seniority: "manager",
    department: "learning",
    employees: 650,
    industry: "life_sciences",
    country: "DE",
    direction: "inbound",
    source: "webinar",
    consent: "granted",
    crmMatch: null,
    signals: { demoRequest: false, pricingViews: 2, contentDownloads: 2, webinarAttended: true, positiveReplies: 0, daysSinceLastActivity: 6 },
  },
  {
    id: "L04",
    company: "Kitebox",
    domain: "kitebox.example",
    title: "Co-founder",
    seniority: "exec",
    department: "other",
    employees: 45,
    industry: "consumer_apps",
    country: "GB",
    direction: "inbound",
    source: "demo_request_form",
    consent: "granted",
    crmMatch: null,
    signals: { demoRequest: true, pricingViews: 3, contentDownloads: 0, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: 0 },
  },
  {
    id: "L05",
    company: "Oakridge Borough Council",
    domain: "oakridge-council.example",
    title: "Head of Organisational Development",
    seniority: "head",
    department: "people",
    employees: 2500,
    industry: "public_sector",
    country: "GB",
    direction: "inbound",
    source: "content_download",
    consent: "granted",
    crmMatch: null,
    signals: { demoRequest: false, pricingViews: 0, contentDownloads: 1, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: 140 },
  },
  {
    id: "L06",
    company: "Vantage Retail Group",
    domain: "vantage-retail.example",
    title: "Talent Director",
    seniority: "exec",
    department: "people",
    employees: 900,
    industry: "retail",
    country: "GB",
    direction: "inbound",
    source: "pricing_page",
    consent: "opted_out",
    crmMatch: null,
    signals: { demoRequest: false, pricingViews: 3, contentDownloads: 1, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: 3 },
  },
  {
    id: "L07",
    company: "Fernlea Studio",
    domain: "fernlea-studio.example",
    title: "L&D Lead",
    seniority: null,
    department: "learning",
    employees: null,
    industry: null,
    country: "GB",
    direction: "inbound",
    source: "demo_request_form",
    consent: "granted",
    crmMatch: null,
    signals: { demoRequest: true, pricingViews: 3, contentDownloads: 0, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: 1 },
  },
  {
    id: "L08",
    company: "Meridian Logistics",
    domain: "meridian-logistics.example",
    title: "Head of Sales Enablement",
    seniority: "head",
    department: "enablement",
    employees: 1200,
    industry: "logistics",
    country: "NL",
    direction: "outbound",
    source: "outbound_list_build",
    consent: "unknown",
    crmMatch: null,
    signals: { demoRequest: false, pricingViews: 0, contentDownloads: 0, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: null },
  },
];
