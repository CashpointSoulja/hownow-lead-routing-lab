import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveDocLink } from "../public/docs-links.js";
import { DOCS } from "../src/docs";

describe("docs cross-links", () => {
  it("maps sibling doc links to in-app docs", () => {
    expect(resolveDocLink("FIVE_WHYS.md", "prd")).toEqual({ slug: "five-whys" });
    expect(resolveDocLink("./EXPERIMENT_DESIGN.md#metrics", "event-taxonomy")).toEqual({ slug: "experiment-design" });
    expect(resolveDocLink("../README.md", "prd")).toEqual({ slug: "readme" });
  });

  it("maps README links under docs/ to in-app docs", () => {
    expect(resolveDocLink("docs/PRD.md", "readme")).toEqual({ slug: "prd" });
    expect(resolveDocLink("docs/DECISION_MAKERS.md", "readme")).toEqual({ slug: "decision-makers" });
  });

  it("sends other repo files to GitHub and leaves absolute URLs alone", () => {
    expect(resolveDocLink("LICENSE", "readme")).toEqual({ href: "https://github.com/CashpointSoulja/hownow-lead-routing-lab/blob/main/LICENSE" });
    expect(resolveDocLink("../src/worker.ts", "prd")).toEqual({ href: "https://github.com/CashpointSoulja/hownow-lead-routing-lab/blob/main/src/worker.ts" });
    expect(resolveDocLink("https://www.gethownow.com/", "prd")).toBeNull();
    expect(resolveDocLink("#deployment", "readme")).toBeNull();
  });

  it("every relative .md link in every doc resolves to an in-app doc", () => {
    const slugs = new Set(DOCS.map((d) => d.slug));
    for (const d of DOCS) {
      for (const [, href] of d.markdown.matchAll(/\]\(([^)\s]+\.md(?:#[^)]*)?)\)/g)) {
        if (/^https?:/.test(href)) continue;
        const link = resolveDocLink(href, d.slug);
        expect(link && "slug" in link && slugs.has(link.slug), `${d.slug}: ${href}`).toBe(true);
      }
    }
  });

  it("README states the verified live URL and no stale deployment claim", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("https://hownow-lead-routing-lab.ayomideahmedcp.workers.dev/");
    expect(readme).not.toMatch(/not (yet )?deployed/i);
  });
});
