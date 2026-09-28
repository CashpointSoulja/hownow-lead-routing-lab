import { marked } from "/vendor/marked.esm.js";
import { AS_OF, LEADS } from "/engine/leads.js";
import { routeLead } from "/engine/router.js";
import { ENTERPRISE_MIN_EMPLOYEES, FIT_WEIGHTS, INTENT_WEIGHTS, QUEUES, REQUIRED_FIELDS, RULES_VERSION, STALE_AFTER_DAYS, TIERS } from "/engine/rules.js";
import { EVENTS, eventsForRoute, validateEvent } from "/engine/taxonomy.js";
import { REPO_URL, resolveDocLink } from "/docs-links.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nice = (s) => String(s).replace(/_/g, " ");
const SOURCE = { demo_request_form: "Demo request form", outbound_sequence_reply: "Outbound reply", webinar: "Webinar", content_download: "Content download", pricing_page: "Pricing page", outbound_list_build: "Outbound list build" };
const CONSENT = { granted: "Marketing consent granted", legitimate_interest: "Legitimate interest (B2B)", opted_out: "Opted out of marketing", unknown: "Unknown" };

const state = {
  leads: structuredClone(LEADS),
  baseline: Object.fromEntries(LEADS.map((l) => [l.id, routeLead(l)])),
  selected: "L01",
  events: [],
};

const results = () => Object.fromEntries(state.leads.map((l) => [l.id, routeLead(l)]));

function log(ev) {
  const errors = validateEvent(ev);
  state.events.push({ ...ev, at: state.events.length + 1, valid: errors.length === 0, errors });
}

for (const id of Object.keys(state.baseline)) eventsForRoute(state.baseline[id]).forEach(log);

/* ---------- Leads view ---------- */

function filtersMatch(lead, r) {
  const q = $("#q").value.trim().toLowerCase();
  const dir = $("#f-direction").value, queue = $("#f-queue").value, guard = $("#f-guard").value, fit = $("#f-fit").value, intent = $("#f-intent").value;
  if (dir && lead.direction !== dir) return false;
  if (queue && r.queue !== queue) return false;
  if (guard === "__any" && !r.guard) return false;
  if (guard === "__none" && r.guard) return false;
  if (guard && !guard.startsWith("__") && r.guard !== guard) return false;
  if (fit && r.fit.tier !== fit) return false;
  if (intent && r.intent.tier !== intent) return false;
  if (!q) return true;
  const hay = [lead.id, lead.company, lead.title, lead.industry, lead.country, SOURCE[lead.source], r.queueLabel, r.owner, r.reason, r.guard, ...r.flags].join(" ").toLowerCase();
  return hay.includes(q);
}

const bar = (score, tier, kind) => `<span class="score ${kind} t-${tier}"><b>${score}</b><i style="--w:${score}%"></i><em>${tier}</em></span>`;

function renderStats(all) {
  const rs = Object.values(all);
  const guarded = rs.filter((r) => r.guard).length;
  const changed = rs.filter((r) => r.guardChangedOutcome).length;
  const owned = rs.filter((r) => r.owner).length;
  $("#stats").innerHTML = [
    [state.leads.length, "synthetic leads"],
    [owned, "with one owner or explicit hold"],
    [0 + rs.filter((r) => !r.owner).length, "left without an owner"],
    [guarded, "stopped by a guard"],
    [changed, "routed differently than score alone"],
  ].map(([n, l]) => `<li><b>${n}</b><span>${l}</span></li>`).join("");
}

function renderList() {
  const all = results();
  renderStats(all);
  const shown = state.leads.filter((l) => filtersMatch(l, all[l.id]));
  $("#list").innerHTML = shown.map((l) => {
    const r = all[l.id];
    const edited = JSON.stringify(l) !== JSON.stringify(LEADS.find((x) => x.id === l.id));
    return `<li><button type="button" class="row${l.id === state.selected ? " on" : ""}" data-id="${l.id}" aria-pressed="${l.id === state.selected}">
      <span class="c-lead"><strong>${esc(l.company)}</strong><small>${l.id} · ${esc(l.title ?? "Role missing")} · ${esc(SOURCE[l.source])}</small></span>
      <span class="c-fit"><small class="lbl">Fit</small>${bar(r.fit.score, r.fit.tier, "fit")}</span>
      <span class="c-intent"><small class="lbl">Intent</small>${bar(r.intent.score, r.intent.tier, "intent")}</span>
      <span class="c-route"><span class="q q-${r.queue}">${esc(r.queueLabel)}</span><small>${esc(r.owner)}</small>${r.guard ? `<span class="chip guard">Guard: ${esc(r.guard)}</span>` : ""}${edited ? `<span class="chip edit">Edited</span>` : ""}</span>
    </button></li>`;
  }).join("");
  $("#empty").hidden = shown.length > 0;
  $("#count").textContent = `Showing ${shown.length} of ${state.leads.length} leads · rules ${RULES_VERSION} · as of ${AS_OF}`;
}

function breakdown(title, lines, total, extra = "") {
  return `<table class="bd"><caption>${title}</caption><tbody>${lines.map((x) => `<tr><th scope="row">${esc(x.factor)}</th><td>${esc(nice(x.value))}</td><td class="pts">${x.points ? `+${x.points}` : "0"}</td></tr>`).join("")}${extra}</tbody><tfoot><tr><th scope="row">Total</th><td></td><td class="pts">${total}</td></tr></tfoot></table>`;
}

function renderDetail() {
  const lead = state.leads.find((l) => l.id === state.selected);
  if (!lead) { $("#detail").innerHTML = ""; return; }
  const r = routeLead(lead);
  const base = state.baseline[lead.id];
  const s = lead.signals;
  const moved = base.queue !== r.queue;
  const fact = (k, v) => `<div><dt>${k}</dt><dd${v === null ? ' class="missing"' : ""}>${v === null ? "missing" : esc(v)}</dd></div>`;
  $("#detail").innerHTML = `
    <div class="d-head">
      <p class="eyebrow">${lead.id} · ${lead.direction} · ${esc(SOURCE[lead.source])}</p>
      <h2>${esc(lead.company)}</h2>
      <dl class="facts">
        ${fact("Role", lead.title)}${fact("Employees", lead.employees === null ? null : lead.employees.toLocaleString("en-GB"))}${fact("Industry", lead.industry === null ? null : nice(lead.industry))}${fact("Country", lead.country)}${fact("Domain", lead.domain)}${fact("Consent", CONSENT[lead.consent])}
      </dl>
    </div>
    <div class="decision q-${r.queue}">
      <p class="eyebrow">Routed to</p>
      <p class="d-queue">${esc(r.queueLabel)}</p>
      <dl class="facts tight"><div><dt>Owner</dt><dd>${esc(r.owner)}</dd></div><div><dt>SLA</dt><dd>${esc(r.sla)}</dd></div></dl>
      <p class="reason">${esc(r.reason)}</p>
      ${r.flags.length ? `<p class="flags">${r.flags.map((f) => `<span class="chip">${esc(f)}</span>`).join("")}</p>` : ""}
      <p class="unguarded">${r.guardChangedOutcome ? `Score alone would have sent this lead to <strong>${esc(QUEUES[r.unguarded.queue].label)}</strong>. The <strong>${esc(r.guard)}</strong> guard changed that.` : "Score alone gives the same queue: no guard changed the outcome."}</p>
      ${moved ? `<p class="moved" role="status">Your edits moved this lead from <strong>${esc(base.queueLabel)}</strong> to <strong>${esc(r.queueLabel)}</strong>.</p>` : ""}
    </div>
    <details class="trace" open><summary>Routing trace (fixed order)</summary><ol>${r.trace.map((t) => `<li class="o-${t.outcome}"><span class="rule">${t.step}. ${esc(t.rule)}</span><span class="out">${t.outcome}</span><span class="det">${esc(t.detail)}</span></li>`).join("")}</ol></details>
    <div class="bds">
      ${breakdown(`Fit ${r.fit.score} · tier ${r.fit.tier}`, r.fit.lines, r.fit.score)}
      ${breakdown(`Intent ${r.intent.score} · ${r.intent.tier}`, r.intent.lines, r.intent.score, `<tr class="mult"><th scope="row">Recency</th><td>${esc(r.intent.recency.label)}</td><td class="pts">×${r.intent.recency.multiplier}</td></tr>`)}
    </div>
    <form class="edit" id="edit" aria-label="Edit engagement signals">
      <h3>Edit signals <small>re-scores and re-routes instantly</small></h3>
      <div class="grid">
        <label class="check"><input type="checkbox" name="demoRequest" ${s.demoRequest ? "checked" : ""} /> Demo request</label>
        <label class="check"><input type="checkbox" name="webinarAttended" ${s.webinarAttended ? "checked" : ""} /> Webinar attended</label>
        <label><span>Pricing views</span><input type="number" name="pricingViews" min="0" max="20" value="${s.pricingViews}" inputmode="numeric" /></label>
        <label><span>Downloads</span><input type="number" name="contentDownloads" min="0" max="20" value="${s.contentDownloads}" inputmode="numeric" /></label>
        <label><span>Positive replies</span><input type="number" name="positiveReplies" min="0" max="10" value="${s.positiveReplies}" inputmode="numeric" /></label>
        <label><span>Days since activity</span><input type="number" name="daysSinceLastActivity" min="0" max="999" value="${s.daysSinceLastActivity ?? ""}" placeholder="none" inputmode="numeric" /></label>
        <label class="wide"><span>Consent</span><select name="consent">${Object.entries(CONSENT).map(([k, v]) => `<option value="${k}"${lead.consent === k ? " selected" : ""}>${v}</option>`).join("")}</select></label>
      </div>
      <button type="button" class="btn ghost" id="reset-lead">Reset this lead</button>
    </form>`;
}

function editField(target) {
  const lead = state.leads.find((l) => l.id === state.selected);
  const before = routeLead(lead);
  const f = target.name;
  if (f === "consent") lead.consent = target.value;
  else if (target.type === "checkbox") lead.signals[f] = target.checked;
  else if (f === "daysSinceLastActivity") lead.signals[f] = target.value === "" ? null : Math.max(0, Math.round(Number(target.value)));
  else lead.signals[f] = Math.max(0, Math.round(Number(target.value) || 0));
  log({ name: "signal_edited", props: { lead_id: lead.id, field: f } });
  const after = routeLead(lead);
  eventsForRoute(after).forEach(log);
  if (after.queue !== before.queue) log({ name: "route_changed", props: { lead_id: lead.id, from_queue: before.queue, to_queue: after.queue } });
  const focusName = f;
  renderList();
  renderDetail();
  renderEvents();
  const again = $(`#edit [name="${focusName}"]`);
  if (again) again.focus();
}

/* ---------- Rules view ---------- */

function renderRules() {
  const t = (head, rows) => `<table class="rt"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const w = INTENT_WEIGHTS;
  $("#rules").innerHTML = `
    <div class="card"><h2>1 · Guards, in order</h2><p class="muted">The first rule that fires decides. Consent always runs first, so nobody who opted out is ever sequenced.</p>
      <ol class="guards">
        <li><b>Consent.</b> Opted out and no direct request → <em>Suppressed</em>. Opted out but asked for a demo → reply to that request only, no sequences.</li>
        <li><b>Consent basis for outbound.</b> Outbound contact with unknown basis → <em>Consent review</em> (RevOps).</li>
        <li><b>Duplicate / existing account.</b> Domain matches a CRM account → <em>its current owner</em>, flagged to merge.</li>
        <li><b>Missing data.</b> Any of ${REQUIRED_FIELDS.map((f) => `<code>${f}</code>`).join(", ")} missing → <em>SDR triage</em> if a live buyer (demo request or Hot), else <em>Data fix</em>.</li>
        <li><b>Stale engagement.</b> Last activity over ${STALE_AFTER_DAYS} days and no demo request → <em>Marketing nurture</em>.</li>
        <li><b>Fit × intent matrix</b> (below).</li>
      </ol></div>
    <div class="card"><h2>2 · Fit (who they are, max 100)</h2>
      ${t(["Factor", "Value", "Points"], [
        ...FIT_WEIGHTS.employees.map((b) => ["Company size", b.label, b.points]),
        ...Object.entries(FIT_WEIGHTS.department).map(([k, v]) => ["Buying team", nice(k), v]),
        ...Object.entries(FIT_WEIGHTS.seniority).map(([k, v]) => ["Seniority", k, v]),
        ["Industry", `Focus: ${FIT_WEIGHTS.focusIndustries.map(nice).join(", ")}`, FIT_WEIGHTS.industry.focus],
        ["Industry", "Other", FIT_WEIGHTS.industry.other],
        ...Object.entries(FIT_WEIGHTS.region).map(([k, v]) => ["Region", k, v]),
      ])}
      <p class="muted">Tiers: ${TIERS.fit.map((b) => `${b.tier} ≥ ${b.min}`).join(" · ")}</p></div>
    <div class="card"><h2>3 · Intent (what they did, max 100)</h2>
      ${t(["Signal", "Points", "Cap"], [
        ["Demo request", w.demoRequest, "–"],
        ["Pricing page view", `${w.pricingView.each} each`, w.pricingView.cap],
        ["Content download", `${w.contentDownload.each} each`, w.contentDownload.cap],
        ["Webinar attended", w.webinarAttended, "–"],
        ["Positive reply (outbound)", `${w.positiveReply.each} each`, w.positiveReply.cap],
      ])}
      ${t(["Recency", "Multiplier"], w.recency.map((r) => [r.label, `×${r.multiplier}`]))}
      <p class="muted">Tiers: ${TIERS.intent.map((b) => `${b.tier} ≥ ${b.min}`).join(" · ")}</p></div>
    <div class="card"><h2>4 · Matrix and queues</h2>
      ${t(["Fit", "Intent", "Queue"], [
        ["A", "Hot, or any demo request", `Enterprise AE (≥${ENTERPRISE_MIN_EMPLOYEES.toLocaleString("en-GB")} employees) or Mid-market AE`],
        ["B or C", "Hot", "SDR triage: a live buyer is never dropped"],
        ["A or B", "Warm", "SDR qualification"],
        ["A", "Cold", "Outbound target list"],
        ["Anything else", "", "Marketing nurture"],
      ])}
      ${t(["Queue", "Owner (role)", "Proposed SLA"], Object.values(QUEUES).map((q) => [q.label, q.owner, q.sla]))}
      <p class="muted">Owners are roles, not people. SLAs are proposals to agree with Sales, not HowNow commitments.</p></div>`;
}

/* ---------- Events view ---------- */

function renderEvents() {
  const ok = state.events.filter((e) => e.valid).length;
  $("#ev-summary").textContent = `${state.events.length} events this session · ${ok} valid · ${state.events.length - ok} rejected`;
  $("#evlog").innerHTML = state.events.slice(-40).reverse().map((e) => `<li class="${e.valid ? "ok" : "bad"}"><code>${e.name}</code> <span>${esc(Object.entries(e.props).map(([k, v]) => `${k}=${v}`).join(" "))}</span>${e.valid ? "" : `<em>${esc(e.errors.join("; "))}</em>`}</li>`).join("");
}

function renderTaxonomy() {
  $("#taxonomy").innerHTML = EVENTS.map((e) => `<div class="ev"><h3><code>${e.name}</code>${e.emittedInLab ? "" : ' <span class="chip">production only</span>'}</h3><p class="muted">${esc(e.when)}</p><p class="props">${Object.entries(e.props).map(([k, p]) => `<code>${k}</code>: ${p.type}${p.nullable ? "?" : ""}`).join(" · ")}</p></div>`).join("");
}

/* ---------- Docs view ---------- */

let docsLoaded = false;
async function loadDocs(slug) {
  try {
    if (!docsLoaded) {
      const list = await (await fetch("/api/docs")).json();
      $("#doclist").innerHTML = list.map((d) => `<button type="button" data-doc="${d.slug}">${esc(d.title)}</button>`).join("");
      docsLoaded = true;
    }
    const doc = await (await fetch(`/api/docs/${slug}`)).json();
    $("#doc").innerHTML = marked.parse(doc.markdown);
    for (const a of document.querySelectorAll("#doc a[href]")) {
      const link = resolveDocLink(a.getAttribute("href"), slug);
      if (link?.slug) { a.dataset.doc = link.slug; a.setAttribute("href", `#docs`); }
      else if (link?.href) a.setAttribute("href", link.href);
      if (/^https?:/.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
    }
    for (const b of document.querySelectorAll("#doclist button")) b.setAttribute("aria-current", String(b.dataset.doc === slug));
  } catch {
    $("#doc").innerHTML = `<p>Docs are served by the Worker API. Read them on <a href="${REPO_URL}/tree/main/docs">GitHub</a>.</p>`;
  }
}

/* ---------- Wiring ---------- */

function show(view) {
  for (const s of document.querySelectorAll(".view")) s.hidden = s.id !== `view-${view}`;
  for (const b of document.querySelectorAll(".tabs button")) b.toggleAttribute("aria-current", b.dataset.view === view);
  if (view === "docs") loadDocs("prd");
  if (view === "events") renderEvents();
  if (location.hash !== `#${view}`) history.replaceState(null, "", `#${view}`);
}

$("#f-queue").insertAdjacentHTML("beforeend", Object.entries(QUEUES).map(([k, q]) => `<option value="${k}">${q.label}</option>`).join(""));
$("#f-guard").insertAdjacentHTML("beforeend", ["Consent", "Consent basis known for outbound", "Duplicate / existing account", "Missing data", "Stale engagement"].map((g) => `<option>${g}</option>`).join(""));

document.querySelector(".tabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-view]"); if (b) show(b.dataset.view); });
$("#filters").addEventListener("input", renderList);
$("#filters").addEventListener("reset", () => setTimeout(renderList));
$("#filters").addEventListener("submit", (e) => e.preventDefault());
$("#list").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-id]");
  if (!b) return;
  state.selected = b.dataset.id;
  renderList();
  renderDetail();
  if (matchMedia("(max-width: 900px)").matches) $("#detail").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
});
$("#detail").addEventListener("change", (e) => { if (e.target.closest("#edit") && e.target.name) editField(e.target); });
$("#detail").addEventListener("click", (e) => {
  if (e.target.id !== "reset-lead") return;
  const i = state.leads.findIndex((l) => l.id === state.selected);
  state.leads[i] = structuredClone(LEADS[i]);
  eventsForRoute(routeLead(state.leads[i])).forEach(log);
  renderList();
  renderDetail();
});
$("#doclist").addEventListener("click", (e) => { const b = e.target.closest("button[data-doc]"); if (b) loadDocs(b.dataset.doc); });
$("#doc").addEventListener("click", (e) => {
  const a = e.target.closest("a[data-doc]");
  if (!a) return;
  e.preventDefault();
  loadDocs(a.dataset.doc).then(() => $("#view-docs").scrollIntoView({ block: "start" }));
});
$("#ev-download").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "lead-routing-lab-events.json" });
  a.click();
  URL.revokeObjectURL(a.href);
});

renderList();
renderDetail();
renderRules();
renderTaxonomy();
show(["leads", "rules", "events", "docs"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "leads");
