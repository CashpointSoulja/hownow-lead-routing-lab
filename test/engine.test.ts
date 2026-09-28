import { describe, expect, it } from "vitest";
import { LEADS } from "../public/engine/leads.js";
import { matrixRoute, routeAll, routeLead, scoreFit, scoreIntent } from "../public/engine/router.js";
import { QUEUES } from "../public/engine/rules.js";
import { eventsForRoute, validateEvent } from "../public/engine/taxonomy.js";

type Lead = (typeof LEADS)[number];
const lead = (id: string): Lead => structuredClone(LEADS.find((l) => l.id === id)!);

describe("synthetic data", () => {
  it("has eight leads on reserved domains with no personal identifiers", () => {
    expect(LEADS).toHaveLength(8);
    for (const l of LEADS) {
      if (l.domain) expect(l.domain).toMatch(/\.example$/);
      expect(JSON.stringify(l)).not.toMatch(/@|\+44|https?:/);
    }
  });
});

describe("routing on the fixed set", () => {
  const expected: Record<string, [string, string | null]> = {
    L01: ["enterprise_ae", null],
    L02: ["existing_owner", "Duplicate / existing account"],
    L03: ["sdr_qualify", null],
    L04: ["sdr_triage", null],
    L05: ["nurture", "Stale engagement"],
    L06: ["suppressed", "Consent"],
    L07: ["sdr_triage", "Missing data"],
    L08: ["consent_review", "Consent basis known for outbound"],
  };
  for (const [id, [queue, guard]] of Object.entries(expected)) {
    it(`${id} → ${queue}`, () => {
      const r = routeLead(lead(id));
      expect(r.queue).toBe(queue);
      expect(r.guard).toBe(guard);
    });
  }

  it("every lead ends with one queue, owner, SLA and reason, and the trace has one decider", () => {
    for (const { result } of routeAll(LEADS)) {
      expect(QUEUES[result.queue]).toBeDefined();
      expect(result.owner).toBeTruthy();
      expect(result.sla).toBeTruthy();
      expect(result.reason).toBeTruthy();
      expect(result.trace.filter((t) => t.outcome === "fired")).toHaveLength(1);
    }
  });

  it("existing accounts keep their CRM owner", () => {
    expect(routeLead(lead("L02")).owner).toBe(LEADS[1].crmMatch!.accountOwner);
  });
});

describe("scores are the sum of their visible lines", () => {
  it("fit and intent", () => {
    for (const l of LEADS) {
      const f = scoreFit(l);
      expect(f.score).toBe(f.lines.reduce((s, x) => s + x.points, 0));
      expect(f.score).toBeLessThanOrEqual(100);
      const i = scoreIntent(l);
      expect(i.score).toBe(Math.min(100, Math.round(i.raw * i.recency.multiplier)));
    }
  });

  it("recency decays intent and no activity scores zero", () => {
    const l = lead("L01");
    const fresh = scoreIntent(l).score;
    l.signals.daysSinceLastActivity = 20;
    expect(scoreIntent(l).score).toBeLessThan(fresh);
    l.signals.daysSinceLastActivity = null;
    expect(scoreIntent(l).score).toBe(0);
  });
});

describe("guards", () => {
  it("opting out suppresses a hot lead unless they asked for a demo", () => {
    const l = lead("L01");
    l.consent = "opted_out";
    const r = routeLead(l);
    expect(r.queue).toBe("enterprise_ae");
    expect(r.flags).toContain("reply-only: no sequences");
    l.signals.demoRequest = false;
    l.signals.pricingViews = 3;
    expect(routeLead(l).queue).toBe("suppressed");
  });

  it("an opted-out contact never lands in a sequence queue whatever the signals", () => {
    for (const base of LEADS) {
      for (const pricing of [0, 3, 10]) for (const replies of [0, 2]) for (const days of [0, 20, 200, null]) {
        const l = structuredClone(base);
        l.consent = "opted_out";
        l.signals = { ...l.signals, demoRequest: false, pricingViews: pricing, positiveReplies: replies, daysSinceLastActivity: days };
        expect(routeLead(l).queue).toBe("suppressed");
      }
    }
  });

  it("missing data with no live intent goes to Data fix, not SDR", () => {
    const l = lead("L07");
    l.signals = { demoRequest: false, pricingViews: 0, contentDownloads: 1, webinarAttended: false, positiveReplies: 0, daysSinceLastActivity: 3 };
    expect(routeLead(l).queue).toBe("data_fix");
  });

  it("a demo request overrides staleness", () => {
    const l = lead("L05");
    l.signals.demoRequest = true;
    l.signals.daysSinceLastActivity = 0;
    expect(routeLead(l).queue).toBe("enterprise_ae");
  });

  it("Hot intent is never sent to nurture by the matrix", () => {
    for (const fit of ["A", "B", "C"]) expect(matrixRoute(LEADS[0], fit, "Hot").queue).not.toBe("nurture");
  });

  it("reports when a guard changed the outcome", () => {
    const r = routeLead(lead("L06"));
    expect(r.guardChangedOutcome).toBe(true);
    expect(r.unguarded.queue).not.toBe("suppressed");
    expect(routeLead(lead("L01")).guardChangedOutcome).toBe(false);
  });
});

describe("events", () => {
  it("every emitted route event is valid", () => {
    for (const { result } of routeAll(LEADS)) for (const e of eventsForRoute(result)) expect(validateEvent(e), e.name).toEqual([]);
  });

  it("rejects personal data, unknown props and bad enums", () => {
    expect(validateEvent({ name: "signal_edited", props: { lead_id: "someone@example.com", field: "consent" } })[0]).toMatch(/personal data/);
    expect(validateEvent({ name: "signal_edited", props: { lead_id: "L01", field: "consent", company: "Acme" } })).toContain("unexpected property: company");
    expect(validateEvent({ name: "route_changed", props: { lead_id: "L01", from_queue: "nurture", to_queue: "somewhere" } })[0]).toMatch(/must be one of/);
    expect(validateEvent({ name: "nope", props: {} })).toEqual(["unknown event: nope"]);
  });
});
