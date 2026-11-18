// Rotation tab: the wheel (who is where, who goes in for who) and the substitution plan that Rotate follows.

import * as model from "../model.js";
import * as court from "../court.js";
import { renderBar } from "../match.js";
import { nameOf, swapText } from "../planui.js";
import { $, $$, esc, sheet, toast } from "../ui.js";

// Fixed court positions around the wheel, clockwise (the way players rotate): front row on top.
const ANGLE = { 4: -150, 3: -90, 2: -30, 1: 30, 6: 90, 5: 150 };
const COLOR = { Setter: "#6d28d9", Pin: "#1f5fbf", Middle: "#16803c", "Right Side": "#c2620a", Libero: "#b91c1c", DS: "#0e7490" };
const roleOf = (m, pid) => (pid ? model.teamPos(m.team_id, pid) || "" : "");
const WHEN = { serve: "to serve", after: "after she serves" };

function wedge(cx, cy, r0, r1, a0, a1) {
  const rad = a => (a * Math.PI) / 180, P = (r, a) => `${(cx + r * Math.cos(rad(a))).toFixed(1)} ${(cy + r * Math.sin(rad(a))).toFixed(1)}`;
  return `M${P(r1, a0)} A${r1} ${r1} 0 0 1 ${P(r1, a1)} L${P(r0, a1)} A${r0} ${r0} 0 0 0 ${P(r0, a0)} Z`;
}

function wheelSvg(m, s, names, srv) {
  const C = 160, R1 = 150, R0 = 46;
  let out = `<svg viewBox="0 0 320 340" class="wheel" role="img" aria-label="Rotation wheel">`;
  out += `<text x="160" y="12" class="w-net" text-anchor="middle">NET</text><line x1="40" y1="18" x2="280" y2="18" class="w-netline"/>`;
  for (const pos of [4, 3, 2, 1, 6, 5]) {
    const a = ANGLE[pos], pid = s.lineup[pos], role = pid && model.isLibero(m.team_id, pid) ? "Libero" : roleOf(m, pid);
    const pair = pid ? court.pairFor(s, pid) : null;
    const col = pid ? COLOR[role] || "#5d6877" : "#c9d1da";
    const front = [4, 3, 2].includes(pos);
    out += `<path d="${wedge(C, C + 20, R0, R1, a - 29, a + 29)}" fill="${col}" class="w-slice${front ? "" : " back"}" data-pos="${pos}"/>`;
    const t = (r, dy = 0) => { const x = C + r * Math.cos((a * Math.PI) / 180), y = C + 20 + r * Math.sin((a * Math.PI) / 180) + dy; return `x="${x.toFixed(1)}" y="${y.toFixed(1)}"`; };
    out += `<text ${t(134, 4)} class="w-pos" text-anchor="middle">${pos}</text>`;
    if (pid) {
      out += `<text ${t(95, -6)} class="w-name" text-anchor="middle">${esc((names[pid] || "").slice(0, 10))}</text>`;
      let sub = "";
      if (pair) {
        const isFront = pair.front === pid;
        const other = isFront ? (pair.back === court.LIB ? "Libero" : names[pair.back] || "?") : names[pair.front] || "?";
        sub = isFront ? `⇄ ${other}` : `for ${other}`;
      } else sub = role ? role.replace("Right Side", "Opp") : "";
      if (pos === 1 && srv === "us") sub = "● serving";
      out += `<text ${t(95, 10)} class="w-sub" text-anchor="middle">${esc(sub.slice(0, 13))}</text>`;
    } else out += `<text ${t(95, 4)} class="w-sub" text-anchor="middle">empty</text>`;
  }
  out += `<line x1="${C - R1}" y1="${C + 20}" x2="${C + R1}" y2="${C + 20}" class="w-row"/>`;
  out += `<circle cx="${C}" cy="${C + 20}" r="${R0 - 4}" class="w-hub"/><text x="${C}" y="${C + 16}" class="w-hub-t" text-anchor="middle">Rotation</text>`;
  out += `<text x="${C}" y="${C + 36}" class="w-hub-n" text-anchor="middle">${(((s.rot % 6) + 6) % 6) + 1}</text>`;
  out += `<text x="160" y="338" class="w-lbl" text-anchor="middle">front row on top · back row below</text></svg>`;
  return out;
}

function checks(m, s) {
  const plan = court.planOf(s), warn = [], info = [];
  if (!court.full(s)) warn.push("Place all six starters on the Court tab first.");
  const counts = {};
  for (const p of plan) if (p.back !== court.LIB) counts[p.back] = (counts[p.back] || 0) + 1;
  for (const [pid, n] of Object.entries(counts)) if (n > 1) warn.push(`${nameOf(m, pid)} is planned to replace ${n} players; she can only be on the court once.`);
  for (const p of plan) {
    if (p.back !== court.LIB && plan.some(q => q.front === p.back)) warn.push(`${nameOf(m, p.back)} is both a front-row and a back-row player in the plan.`);
    if (!model.rosterRow(m.team_id, p.front) || (p.back !== court.LIB && !model.rosterRow(m.team_id, p.back))) warn.push("A planned player is no longer on this team's roster; edit or remove that swap.");
  }
  const libServes = plan.filter(p => p.back === court.LIB && p.when === "serve").length;
  if (libServes > 1) warn.push("The libero is set to serve for more than one player. She can serve for one at most.");
  if (plan.some(p => p.back === court.LIB) && !model.rosterFor(m.team_id).some(e => model.isLibero(m.team_id, e.p.id)))
    warn.push("The plan uses the libero, but nobody on the roster has the position Libero (More → Team).");
  const perLap = plan.filter(p => p.back !== court.LIB).length * 2;
  if (plan.length) info.push(`Each time around the rotation uses ${perLap} of the ${court.SUB_LIMIT} substitutions (libero swaps don't count).`);
  if (perLap * 2 > court.SUB_LIMIT && perLap <= court.SUB_LIMIT) warn.push("A long set that goes around twice would run out of substitutions; the app skips planned subs once all 15 are used.");
  if (perLap > court.SUB_LIMIT) warn.push(`The plan needs more than ${court.SUB_LIMIT} substitutions to go around once.`);
  return { warn, info };
}

async function editPair(m, ctx, pair, startPid) {
  const entries = model.rosterFor(m.team_id), names = model.shortNames(entries);
  const s = court.state(m), plan = court.planOf(s);
  const isL = pid => model.isLibero(m.team_id, pid), hasLib = entries.some(e => isL(e.p.id));
  const cur = pair || { front: startPid || "", back: "", when: "serve" };
  const opt = (v, l, sel) => `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(l)}</option>`;
  const lab = e => `#${e.r.number ?? ""} ${names[e.p.id]}${model.teamPos(m.team_id, e.p.id) ? " (" + model.teamPos(m.team_id, e.p.id) + ")" : ""}`;
  const r = await sheet({
    title: pair ? "Change this swap" : "Plan a swap",
    body: `<label class="field">Front-row player<select id="pf">${opt("", "Choose…", cur.front)}${entries.filter(e => !isL(e.p.id)).map(e => opt(e.p.id, lab(e), cur.front)).join("")}</select></label>
      <label class="field">Replaced in the back row by<select id="pb">${opt("", "Choose…", cur.back)}${hasLib ? opt(court.LIB, "The libero", cur.back) : ""}${entries.filter(e => !isL(e.p.id)).map(e => opt(e.p.id, lab(e), cur.back)).join("")}</select></label>
      <label class="field">When she comes in<select id="pw">${opt("serve", "To serve: as the spot rotates to position 1", cur.when)}${opt("after", "After she serves: when we lose her serve", cur.when)}</select></label>
      <p class="muted small" style="margin:0">The front-row player comes back automatically when the spot rotates to the front row (position 4). The libero never serves unless you choose "To serve" for her.</p>`,
    onOpen: el => { const b = $("#pb", el), w = $("#pw", el); b.onchange = () => { if (b.value === court.LIB && !pair) w.value = "after"; }; },
    buttons: [{ label: "Save", value: "save", cls: "primary" }, ...(pair ? [{ label: "Remove swap", value: "remove" }] : []), { label: "Cancel", value: null }],
    check: (el, v) => {
      if (v !== "save") return true;
      const f = $("#pf", el).value, b = $("#pb", el).value, w = $("#pw", el).value;
      if (!f || !b) return "Choose both players.";
      if (f === b) return "Choose two different players.";
      if (plan.some(p => p !== pair && p.front === f)) return "That player already has a planned swap; change that one instead.";
      if (b === court.LIB && w === "serve" && plan.some(p => p !== pair && p.back === court.LIB && p.when === "serve")) return "The libero can serve for one player only.";
      return true;
    },
  });
  if (r.value === "remove") { court.savePlan(m, s, plan.filter(p => !(p.front === pair.front && p.back === pair.back))); toast("Swap removed."); ctx.refresh(); }
  if (r.value === "save") {
    const np = { front: $("#pf", r.el).value, back: $("#pb", r.el).value, when: $("#pw", r.el).value };
    court.savePlan(m, s, [...plan.filter(p => !(pair && p.front === pair.front && p.back === pair.back)), np]);
    toast("Swap saved. Rotate will make it for you."); ctx.refresh();
  }
}

export function render(main, ctx) {
  const m = renderBar(main, ctx);
  if (!m) return;
  const s = court.state(m), entries = model.rosterFor(m.team_id), names = model.shortNames(entries);
  const srv = m.scoring === "points" ? court.serving(m, s) : null;
  const plan = court.planOf(s), { warn, info } = checks(m, s);
  const next = court.full(s) ? court.previewRotate(m, s) : { swaps: [], notes: [] };
  const lab = pid => (pid === court.LIB ? "Libero" : nameOf(m, pid));
  main.insertAdjacentHTML("beforeend", `<section class="card">
      <div class="card-head"><h2>Rotation</h2><span class="muted">Set ${model.curSet(m)}</span><span class="grow"></span>
        <span class="subs ${s.subs >= court.SUB_LIMIT ? "maxed" : ""}">Subs ${s.subs} of ${court.SUB_LIMIT}</span></div>
      <div class="wheel-wrap">${wheelSvg(m, s, names, srv)}</div>
      <div class="legend">${Object.entries(COLOR).map(([k, c]) => `<span><i style="background:${c}"></i>${esc(k === "Right Side" ? "Opposite" : k)}</span>`).join("")}</div>
      <p class="small" style="margin:0"><b>Next Rotate:</b> ${next.swaps.length ? next.swaps.map(w => esc(swapText(m, w))).join("; ") : "no planned subs"}${next.notes.length ? ` <span class="muted">(${esc(next.notes.join(" "))})</span>` : ""}</p>
      <p class="muted small" style="margin:0">Tap a slice to plan who goes in for her. The court is changed on the Court tab or with Rotate.</p>
      <div class="row"><button class="btn" type="button" id="to-court2">Court tab</button><button class="btn primary" type="button" id="rot2" ${court.liberoFront(m, s) ? "disabled" : ""}>Rotate ↻</button></div>
    </section>
    <section class="card">
      <div class="card-head"><h3>Planned swaps</h3><span class="grow"></span><button class="btn small primary" type="button" id="add">+ Plan a swap</button></div>
      ${plan.length ? `<div class="list">${plan.map((p, i) => `<button type="button" class="item" data-i="${i}">
          <span class="main-txt"><b>${esc(lab(p.front))} ⇄ ${esc(lab(p.back))}</b>
          <span class="sub">${esc(lab(p.back))} comes in ${esc(WHEN[p.when])}; ${esc(lab(p.front))} returns for the front row</span></span><span class="chev">›</span></button>`).join("")}</div>`
        : `<p class="muted" style="margin:0">No swaps planned. Rotate just rotates, as before.</p>`}
      <p class="muted small" style="margin:0">Each new set starts with this plan. Subs you make by hand are respected: a planned swap is skipped if the player isn't where the plan expects.</p>
    </section>
    ${warn.length || info.length ? `<section class="card">${warn.map(w => `<div class="notice">${esc(w)}</div>`).join("")}${info.map(t => `<p class="small" style="margin:0">${esc(t)}</p>`).join("")}</section>` : ""}`);
  for (const p of $$(".w-slice", main)) p.onclick = () => {
    const pid = s.lineup[+p.dataset.pos];
    if (!pid) { toast("Place a player here on the Court tab first."); return; }
    if (model.isLibero(m.team_id, pid)) { const pr = plan.find(x => x.back === court.LIB && x.front === s.libFor); return pr ? editPair(m, ctx, pr) : toast("The libero's swaps are planned from the players she replaces."); }
    editPair(m, ctx, court.pairFor(s, pid), pid);
  };
  for (const b of $$("[data-i]", main)) b.onclick = () => editPair(m, ctx, plan[+b.dataset.i]);
  $("#add", main).onclick = () => editPair(m, ctx, null);
  $("#to-court2", main).onclick = () => ctx.go("court");
  $("#rot2", main).onclick = async () => {
    const r = court.rotate(m, court.state(m));
    if (r.error) { toast(r.error); return; }
    ctx.refresh();
    const { showSwaps } = await import("../planui.js");
    showSwaps(m, r, ctx);
  };
}
