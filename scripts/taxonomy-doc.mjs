import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EVENTS } from "../public/engine/taxonomy.js";

/** @param {import("../public/engine/taxonomy.js").Prop} p */
const describe = (p) => (p.type === "enum" ? `enum: ${(p.values ?? []).map((v) => `\`${v}\``).join(", ")}` : p.type) + (p.nullable ? " (nullable)" : "");

export function renderEventTable() {
  return EVENTS.map((e) => {
    const rows = Object.entries(e.props).map(([k, p]) => `| \`${k}\` | ${describe(p)} |`).join("\n");
    return `### \`${e.name}\`\n\n${e.when}. ${e.emittedInLab ? "Emitted live in the lab." : "Not emitted in the lab: needs a real CRM."}\n\n| Property | Type |\n|---|---|\n${rows}\n`;
  }).join("\n");
}

const START = "<!-- events:start -->";
const END = "<!-- events:end -->";

/** @param {string} doc */
export function injectEvents(doc) {
  const a = doc.indexOf(START), b = doc.indexOf(END);
  if (a < 0 || b < 0) throw new Error("markers missing");
  return `${doc.slice(0, a + START.length)}\n\n${renderEventTable()}\n${doc.slice(b)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = new URL("../docs/EVENT_TAXONOMY.md", import.meta.url);
  const { readFileSync } = await import("node:fs");
  writeFileSync(path, injectEvents(readFileSync(path, "utf8")));
}
