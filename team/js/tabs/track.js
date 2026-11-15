// Serve and Receive tracking tabs (Attack, Block and Set arrive in Phase 2).

import * as db from "../db.js";
import * as model from "../model.js";
import { renderBar } from "../match.js";
import { $, $$, esc, toast } from "../ui.js";

const BUTTONS = {
  serve:   [["ace", "Ace", "g"], ["in", "In", "b"], ["out", "Out", "o"]],
  receive: [["0", "0", "r"], ["1", "1", "o"], ["2", "2", "b"], ["3", "3", "g"]],
};
const RESULT_TEXT = { ace: "Ace", in: "In", out: "Out" };
let lastMsg = "";

function summary(mode, m, pid) {
  if (!pid) return "Tap a player, then a result.";
  const s = model.tally(model.actionsFor(m.id, a => a.player_id === pid));
  if (mode === "serve")
    return s.serves ? `This match: ${s.serves} serve${s.serves > 1 ? "s" : ""} · ${s.ace} ace${s.ace === 1 ? "" : "s"} · ${s.out} out · ${s.srvPct}% in` : "No serves yet this match.";
  return s.passes ? `This match: ${s.passes} pass${s.passes > 1 ? "es" : ""} · avg ${s.avg}` : "No passes yet this match.";
}

export function render(main, ctx, mode) {
  const m = renderBar(main, ctx);
  if (!m) return;
  if (!m.scoring) {
    main.insertAdjacentHTML("beforeend", `<section class="card"><p>Choose how to score this match before you start.</p>
      <button class="btn primary" type="button" id="choose">Choose scoring</button></section>`);
    $("#choose", main).onclick = async () => { const { chooseScoring } = await import("../match.js"); if (await chooseScoring(m)) ctx.refresh(); };
    return;
  }
  const entries = model.rosterFor(m.team_id);
  if (!entries.length) {
    main.insertAdjacentHTML("beforeend", `<section class="card"><h2>No players on this team</h2>
      <p class="muted">Add players to the team on More → Team.</p>
      <button class="btn primary" type="button" id="to-team">Open Team</button></section>`);
    $("#to-team", main).onclick = () => ctx.go("team");
    return;
  }
  const key = `sel_${mode}`;
  let sel = db.getLocal(key);
  if (!entries.some(e => e.p.id === sel)) sel = null;
  const names = model.shortNames(entries);

  main.insertAdjacentHTML("beforeend", `<section class="card">
      <div class="card-head"><h2>${mode === "serve" ? "Serve" : "Serve receive"}</h2><span class="grow"></span>
        <span class="muted small">${mode === "serve" ? "Pick the server" : "Pick the passer"}</span></div>
      <div class="chips">${entries.map(({ r, p }) => `<button type="button" class="pchip${p.id === sel ? " sel" : ""}" data-p="${esc(p.id)}">
          <span class="n">${esc(r.number ?? "")}</span><span class="nm">${esc(names[p.id])}</span></button>`).join("")}</div>
    </section>
    <section class="card">
      <div class="results">${BUTTONS[mode].map(([v, l, c]) => `<button type="button" class="res ${c}" data-r="${esc(v)}">${esc(l)}</button>`).join("")}</div>
      <div class="feedback"><span class="msg" id="fb">${esc(lastMsg)}</span>
        <button type="button" class="btn small" id="undo">↶ Undo last</button></div>
      <p class="muted small" id="sum">${esc(summary(mode, m, sel))}</p>
    </section>`);

  for (const b of $$("[data-p]", main)) b.onclick = () => {
    sel = b.dataset.p; db.setLocal(key, sel);
    for (const x of $$("[data-p]", main)) x.classList.toggle("sel", x === b);
    $("#sum", main).textContent = summary(mode, m, sel);
  };
  for (const b of $$("[data-r]", main)) b.onclick = () => {
    if (!sel) { toast("Tap a player first."); return; }
    const p = entries.find(e => e.p.id === sel);
    const r = model.record(db.get("matches", m.id), sel, mode, b.dataset.r);
    const what = mode === "serve" ? RESULT_TEXT[b.dataset.r] : `Pass ${b.dataset.r}`;
    lastMsg = `${what} · #${p.r.number ?? ""} ${names[sel]}${r.point ? ` · Point ${r.point} ${r.score.us}–${r.score.them}` : ""}`;
    try { navigator.vibrate?.(30); } catch {}
    ctx.refresh();
    $("#fb")?.classList.add("pop");
  };
  $("#undo", main).onclick = () => {
    const rows = model.undoLast(m);
    if (!rows) { toast("Nothing to undo in this match."); return; }
    const a = rows.find(x => x.skill !== "point") || rows[0];
    const who = a.player_id ? names[a.player_id] || "" : "";
    lastMsg = `Undid ${a.skill === "point" ? `point ${a.result}` : `${a.skill === "serve" ? RESULT_TEXT[a.result] : "pass " + a.result}`}${who ? " · " + who : ""}`;
    ctx.refresh();
  };
}

export function renderAttack(main, ctx) {
  const m = renderBar(main, ctx);
  main.insertAdjacentHTML("beforeend", `<section class="card"><h2>Attack, Block, Set</h2>
    <p>Tracking for attacks (Kill, In play, Error), blocks (Solo, Assist, Error) and set assists (Assist, Error) arrives in Phase 2.</p>
    <p class="muted small">It will appear here automatically: tap Update when the bar shows up at the bottom of the screen.</p></section>`);
  return m;
}
