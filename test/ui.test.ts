import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("public/index.html", "utf8");
const app = readFileSync("public/app.js", "utf8");

describe("UI contract", () => {
  it("every id the app queries exists in the page", () => {
    const ids = new Set([...app.matchAll(/\$\("#([a-z-]+)"\)/g)].map((m) => m[1]));
    const dynamic = new Set(["edit", "reset-lead"]);
    for (const id of ids) if (!dynamic.has(id)) expect(html, id).toContain(`id="${id}"`);
  });

  it("shows the disclaimer and synthetic-data notice", () => {
    expect(html).toContain("Not affiliated");
    expect(html).toContain("Synthetic data only");
    expect(html).toContain("No HubSpot connection, no outreach");
  });
});
