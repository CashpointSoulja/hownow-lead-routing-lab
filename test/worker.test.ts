import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import worker from "../src/worker";
import { DISCLAIMER } from "../src/disclaimer";
import { DOCS } from "../src/docs";
import { injectEvents } from "../scripts/taxonomy-doc.mjs";

const env = { ASSETS: { fetch: async () => new Response("asset") } } as unknown as { ASSETS: Fetcher };
const call = (path: string, method = "GET") =>
  worker.fetch!(new Request(`https://lab.test${path}`, { method }) as Parameters<NonNullable<typeof worker.fetch>>[0], env);

describe("worker", () => {
  it("serves health with the disclaimer", async () => {
    const r = await call("/api/health");
    expect(await r.json()).toMatchObject({ ok: true, data: "synthetic", crm: "none", outreach: false });
    expect(r.headers.get("x-disclaimer")).toBe(DISCLAIMER);
  });

  it("serves routes for all eight leads", async () => {
    const body = (await (await call("/api/routes")).json()) as { leads: { queue: string }[] };
    expect(body.leads).toHaveLength(8);
  });

  it("lists and serves docs; rejects other methods and paths", async () => {
    const list = (await (await call("/api/docs")).json()) as { slug: string }[];
    expect(list.map((d) => d.slug)).toEqual(["readme", "prd", "five-whys", "event-taxonomy", "experiment-design", "validation-plan", "decision-makers"]);
    expect((await call("/api/docs/nope")).status).toBe(404);
    expect((await call("/api/nope")).status).toBe(404);
    expect((await call("/api/health", "POST")).status).toBe(405);
    expect(await (await call("/")).text()).toBe("asset");
  });
});

describe("docs", () => {
  it("every document carries the disclaimer", () => {
    for (const d of DOCS) expect(d.markdown, d.slug).toContain("Independent concept by Ayo Ahmed; not affiliated with HowNow");
  });

  it("no document claims measured results", () => {
    for (const d of DOCS) expect(d.markdown, d.slug).not.toMatch(/\b\d+(\.\d+)?% (lift|uplift|increase|improvement|conversion)/i);
  });

  it("the event taxonomy doc matches the engine", () => {
    const doc = readFileSync("docs/EVENT_TAXONOMY.md", "utf8");
    expect(injectEvents(doc)).toBe(doc);
  });

  it("the PRD states the fit gaps", () => {
    const prd = DOCS.find((d) => d.slug === "prd")!.markdown;
    for (const gap of ["HubSpot", "SQL", "two or more years", "end-to-end ownership"]) expect(prd).toContain(gap);
  });
});
