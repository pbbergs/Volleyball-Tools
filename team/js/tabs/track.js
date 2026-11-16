// Serve, Receive and Attack / Block / Set tracking tabs.

import * as db from "../db.js";
import * as model from "../model.js";
import * as court from "../court.js";
import { renderBar, chooseScoring } from "../match.js";
import { $, $$, esc, toast } from "../ui.js";

const BUTTONS = {
  serve:   [["ace", "Ace", "g"], ["in", "In", "b"], ["out", "Out", "o"]],
  receive: [["0", "0", "r"], ["1", "1", "o"], ["2", "2", "b"], ["3", "3", "g"]],
  attack:  [["kill", "Kill", "g"], ["in play", "In play", "b"], ["error", "Error", "r"]],
  block:   [["solo", "Solo", "g"], ["assist", "Assist", "b"], ["error", "Error", "r"]],
  set:     [["assist", "Assist", "g"], ["error", "Error", "r"]],
};
const TITLE = { serve: "Serve", receive: "Serve receive", attack: "Attack", block: "Block", set: "Set" };
function words(skill, r) {
  r = String(r).toLowerCase();
  if (skill === "receive") return `Pass ${r}`;
  if (skill === "serve") return r === "ace" ? "Ace" : r === "in" ? "Serve in" : "Serve out";
  return `${TITLE[skill]} ${r}`;
}
let lastMsg = "";
let atkSkill = "attack";

function summary(skill, m, pid) {
  if (!pid) return "Tap a player, then a result.";
  const s = model.tally(model.actionsFor(m.id, a => a.player_id === pid));
  switch (skill) {
    case "serve": return s.serves ? `This match: ${s.serves} serve${s.serves > 1 ? "s" : ""} · ${s.ace} ace${s.ace === 1 ? "" : "s"} · ${s.out} out · ${s.srvPct}% in` : "No serves yet this match.";
    case "receive": return s.passes ? `This match: ${s.passes} pass${s.passes > 1 ? "es" : ""} · avg ${s.avg}` : "No passes yet this match.";
    case "attack": return s.ta ? `This match: ${s.kill} kill${s.kill === 1 ? "" : "s"} · ${s.atkErr} error${s.atkErr === 1 ? "" : "s"} · ${s.ta} attempts · hitting ${s.hitPct}` : "No attacks yet this match.";
    case "block": return s.solo + s.blkAst + s.blkErr ? `This match: ${s.solo} solo · ${s.blkAst} assist · ${s.blkErr} error` : "No blocks yet this match.";
    default: return s.setAst + s.setErr ? `This match: ${s.setAst} assist${s.setAst === 1 ? "" : "s"} · ${s.setErr} error${s.setErr === 1 ? "" : "s"}` : "No sets recorded yet this match.";
  }
}

// Who is on the court (player id -> position); the bench in jersey order.
function ordered(m, entries) {
  const s = court.state(m), pos = Object.fromEntries(Object.entries(s.lineup).filter(([, v]) => v).map(([k, v]) => [v, +k]));
  return { s, list: [...entries].sort((a, b) => (pos[a.p.id] || 99) - (pos[b.p.id] || 99)), pos };
}

function trackCard(main, ctx, m, skill, heading) {
  const entries = model.rosterFor(m.team_id);
  if (!entries.length) {
    main.insertAdjacentHTML("beforeend", `<section class="card"><h2>No players on this team</h2>
      <p class="muted">Add players to the team on More → Team.</p>
      <button class="btn primary" type="button" id="to-team">Open Team</button></section>`);
    $("#to-team", main).onclick = () => ctx.go("team");
    return;
  }
  const { s, list, pos } = ordered(m, entries);
  const names = model.shortNames(entries);
  const key = `sel_${skill}`;
  let sel = db.getLocal(key);
  let note = "";
  if (skill === "serve" && s.lineup[1]) {
    const srv = m.scoring === "points" ? court.serving(m, s) : null;
    if (srv === "them") note = "They're serving. Track the pass on Receive.";
    else { sel = s.lineup[1]; note = "Server at position 1 is picked for you."; }
  }
  if (!entries.some(e => e.p.id === sel)) sel = null;
  const hasCourt = Object.keys(pos).length > 0;
  const chip = ({ r, p }, extra = "") => `<button type="button" class="pchip${p.id === sel ? " sel" : ""}${extra}" data-p="${esc(p.id)}">
      <span class="n">${esc(r.number ?? "")}</span><span class="nm">${esc(names[p.id])}</span></button>`;
  const byId = Object.fromEntries(entries.map(e => [e.p.id, e]));
  // Players on the court are laid out exactly like the Court tab: 4 3 2 across the front, 5 6 1 across the back.
  const courtHtml = hasCourt ? `<div class="courtchips" aria-label="On the court">${[4, 3, 2, 5, 6, 1].map(n => {
      const e = byId[s.lineup[n]];
      return e ? chip(e, " oncourt").replace('<span class="n">', `<span class="pos">${n}</span><span class="n">`)
               : `<div class="pchip empty"><span class="pos">${n}</span>—</div>`;
    }).join("")}</div>` : "";
  const bench = list.filter(e => !pos[e.p.id]);

  main.insertAdjacentHTML("beforeend", `<section class="card">
      <div class="card-head">${heading}<span class="grow"></span>
        <span class="muted small">${note || (skill === "serve" ? "Pick the server" : "Pick the player")}</span></div>
      ${courtHtml}
      <div class="chips">${hasCourt && bench.length ? `<div class="chip-sep">Bench</div>` : ""}${bench.map(e => chip(e)).join("")}</div>
    </section>
    <section class="card">
      <div class="results">${BUTTONS[skill].map(([v, l, c]) => `<button type="button" class="res ${c}" data-r="${esc(v)}">${esc(l)}</button>`).join("")}</div>
      <div class="feedback"><span class="msg" id="fb">${esc(lastMsg)}</span>
        <button type="button" class="btn small" id="undo">↶ Undo last</button></div>
      <p class="muted small" id="sum">${esc(summary(skill, m, sel))}</p>
    </section>`);

  for (const b of $$("[data-p]", main)) b.onclick = () => {
    sel = b.dataset.p; db.setLocal(key, sel);
    for (const x of $$("[data-p]", main)) x.classList.toggle("sel", x === b);
    $("#sum", main).textContent = summary(skill, m, sel);
  };
  for (const b of $$("[data-r]", main)) b.onclick = () => {
    if (!sel) { toast("Tap a player first."); return; }
    const e = entries.find(x => x.p.id === sel);
    const r = court.record(db.get("matches", m.id), sel, skill, b.dataset.r);
    lastMsg = `${words(skill, b.dataset.r)} · #${e.r.number ?? ""} ${names[sel]}` +
      (r.point ? ` · Point ${r.point} ${r.score.us}–${r.score.them}` : "") + (r.rotated ? " · Side out, rotated" : "");
    try { navigator.vibrate?.(30); } catch {}
    ctx.refresh();
    $("#fb")?.classList.add("pop");
  };
  $("#undo", main).onclick = () => {
    const rows = court.undo(db.get("matches", m.id));
    if (!rows) { toast("Nothing to undo in this match."); return; }
    const a = rows.find(x => x.skill !== "point") || rows[0];
    const who = a.player_id ? names[a.player_id] || "" : "";
    lastMsg = `Undid ${a.skill === "point" ? `point ${a.result}` : words(a.skill, a.result)}${who ? " · " + who : ""}`;
    ctx.refresh();
  };
}

function ready(main, ctx) {
  const m = renderBar(main, ctx);
  if (!m) return null;
  if (!m.scoring) {
    main.insertAdjacentHTML("beforeend", `<section class="card"><p>Choose how to score this match before you start.</p>
      <button class="btn primary" type="button" id="choose">Choose scoring</button></section>`);
    $("#choose", main).onclick = async () => { if (await chooseScoring(m)) ctx.refresh(); };
    return null;
  }
  return m;
}

export function render(main, ctx, mode) {
  const m = ready(main, ctx);
  if (m) trackCard(main, ctx, m, mode, `<h2>${TITLE[mode]}</h2>`);
}

export function renderAttack(main, ctx) {
  const m = ready(main, ctx);
  if (!m) return;
  const seg = `<div class="seg" role="tablist">${["attack", "block", "set"].map(k =>
    `<button type="button" role="tab" data-seg="${k}" aria-selected="${k === atkSkill}">${TITLE[k]}</button>`).join("")}</div>`;
  trackCard(main, ctx, m, atkSkill, seg);
  for (const b of $$("[data-seg]", main)) b.onclick = () => { atkSkill = b.dataset.seg; lastMsg = ""; ctx.refresh(); };
}
