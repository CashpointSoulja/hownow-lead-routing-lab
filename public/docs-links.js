export const REPO_URL = "https://github.com/CashpointSoulja/hownow-lead-routing-lab";

const DOC_FILES = {
  "README.md": "readme",
  "docs/PRD.md": "prd",
  "docs/FIVE_WHYS.md": "five-whys",
  "docs/EVENT_TAXONOMY.md": "event-taxonomy",
  "docs/EXPERIMENT_DESIGN.md": "experiment-design",
  "docs/VALIDATION_PLAN.md": "validation-plan",
  "docs/DECISION_MAKERS.md": "decision-makers",
};

/**
 * Resolve a link found in a rendered doc. `docSlug` is the doc it appears in
 * (README lives at the repo root, every other doc under docs/).
 * Returns { slug } for another in-app doc, { href } for a repo file on GitHub,
 * or null to leave the link untouched (absolute URLs, mailto, same-page anchors).
 */
export function resolveDocLink(href, docSlug) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#") || href.startsWith("//")) return null;
  const [path] = href.split("#");
  const base = docSlug === "readme" ? [] : ["docs"];
  const parts = [...base];
  for (const seg of path.replace(/^\//, "").split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  const file = href.startsWith("/") ? path.replace(/^\//, "") : parts.join("/");
  if (DOC_FILES[file]) return { slug: DOC_FILES[file] };
  return { href: `${REPO_URL}/blob/main/${file}` };
}
