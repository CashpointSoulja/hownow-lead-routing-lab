import { DISCLAIMER } from "./disclaimer";
import { DOCS } from "./docs";
import { AS_OF, LEADS } from "../public/engine/leads.js";
import { routeAll } from "../public/engine/router.js";
import { RULES_VERSION } from "../public/engine/rules.js";

interface Env {
  ASSETS: Fetcher;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-disclaimer": DISCLAIMER },
  });

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method !== "GET" && pathname.startsWith("/api/")) return json({ error: "method not allowed" }, 405);

    if (pathname === "/api/health") return json({ ok: true, disclaimer: DISCLAIMER, data: "synthetic", crm: "none", outreach: false, rulesVersion: RULES_VERSION });
    if (pathname === "/api/routes") return json({ asOf: AS_OF, rulesVersion: RULES_VERSION, disclaimer: DISCLAIMER, leads: routeAll(LEADS).map(({ lead, result }) => ({ id: lead.id, company: lead.company, queue: result.queue, owner: result.owner, sla: result.sla, fit: result.fit.score, intent: result.intent.score, guard: result.guard, reason: result.reason })) });
    if (pathname === "/api/docs") return json(DOCS.map(({ slug, title }) => ({ slug, title })));
    const m = pathname.match(/^\/api\/docs\/([a-z0-9-]+)$/);
    if (m) {
      const doc = DOCS.find((d) => d.slug === m[1]);
      return doc ? json(doc) : json({ error: "doc not found" }, 404);
    }
    if (pathname.startsWith("/api/")) return json({ error: "not found" }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
