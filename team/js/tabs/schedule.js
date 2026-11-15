// Season schedule: day, date, opponent, location, optional time. Tap a match to track it or edit it.

import * as db from "../db.js";
import * as model from "../model.js";
import { chooseScoring } from "../match.js";
import { $, $$, esc, sheet, ask, toast, fmtDate, fmtTime, dayName, today } from "../ui.js";

function matchForm(m = {}) {
  return `<div class="grid2">
      <label class="field">Date<input type="date" id="f-date" value="${esc(m.date || today())}"></label>
      <label class="field">Time (optional)<input type="time" id="f-time" value="${esc(m.time || "")}"></label>
    </div>
    <label class="field">Opponent<input type="text" id="f-opp" value="${esc(m.opponent || "")}" maxlength="60" autocomplete="off"></label>
    <label class="field">Location<input type="text" id="f-loc" value="${esc(m.location || "")}" maxlength="80"></label>
    <label class="field">Event or tournament (optional)<input type="text" id="f-evt" value="${esc(m.event || "")}" maxlength="80"></label>`;
}
const readForm = el => ({
  date: $("#f-date", el).value, time: $("#f-time", el).value || "",
  opponent: $("#f-opp", el).value.trim(), location: $("#f-loc", el).value.trim(), event: $("#f-evt", el).value.trim(),
});
const checkForm = el => (!$("#f-date", el).value ? "Pick a date." : !$("#f-opp", el).value.trim() ? "Type the opponent's name." : true);

async function addMatch(team, ctx) {
  const r = await sheet({ title: "Add a match", body: matchForm(),
    buttons: [{ label: "Add match", value: true, cls: "primary" }, { label: "Cancel", value: null }], check: checkForm });
  if (!r.value) return;
  db.insert("matches", { team_id: team.id, status: "scheduled", ...readForm(r.el) });
  toast("Match added.");
  ctx.refresh();
}

async function editScores(m, ctx) {
  const rows = [1, 2, 3, 4, 5].map(n => { const s = model.setRow(m.id, n); return { n, us: s?.us ?? "", them: s?.them ?? "" }; });
  const r = await sheet({
    title: `Set scores vs ${m.opponent}`,
    body: `<div class="grid3" style="grid-template-columns:auto 1fr 1fr;align-items:center">
        <span></span><b class="small">Us</b><b class="small">${esc(m.opponent)}</b>
        ${rows.map(x => `<b>Set ${x.n}</b>
          <input type="number" inputmode="numeric" min="0" max="99" id="u${x.n}" value="${esc(x.us)}" aria-label="Set ${x.n} us">
          <input type="number" inputmode="numeric" min="0" max="99" id="t${x.n}" value="${esc(x.them)}" aria-label="Set ${x.n} them">`).join("")}
      </div>
      <label class="chk"><input type="checkbox" id="done" ${m.status === "played" ? "checked" : ""}> This match is finished</label>
      <p class="muted small">Leave a set blank if it wasn't played.</p>`,
    buttons: [{ label: "Save", value: true, cls: "primary" }, { label: "Cancel", value: null }],
    check: el => {
      for (const n of [1, 2, 3, 4, 5]) {
        const u = $("#u" + n, el).value.trim(), t = $("#t" + n, el).value.trim();
        if ((u === "") !== (t === "")) return `Set ${n} needs both scores, or neither.`;
        if (u !== "" && !(/^\d{1,2}$/.test(u) && /^\d{1,2}$/.test(t))) return `Set ${n}: use whole numbers.`;
      }
      return true;
    },
  });
  if (!r.value) return;
  for (const n of [1, 2, 3, 4, 5]) {
    const u = $("#u" + n, r.el).value.trim(), t = $("#t" + n, r.el).value.trim(), old = model.setRow(m.id, n);
    if (u === "") { if (old) db.remove("sets", old.id); }
    else model.saveSetScore(m.id, n, +u, +t);
  }
  const done = $("#done", r.el).checked;
  db.update("matches", m.id, { status: done ? "played" : (m.status === "played" ? "in progress" : m.status) });
  toast("Scores saved.");
  ctx.refresh();
}

async function openMatch(m, ctx) {
  const sets = model.setsFor(m.id), res = model.matchResult(m.id);
  const r = await sheet({
    title: `vs ${m.opponent}`,
    body: `<p class="sheet-msg">${esc(dayName(m.date))}, ${esc(fmtDate(m.date))}${m.time ? " · " + esc(fmtTime(m.time)) : ""}</p>
      ${m.location ? `<p class="muted" style="margin:0">${esc(m.location)}</p>` : ""}
      ${m.event ? `<p class="muted" style="margin:0">${esc(m.event)}</p>` : ""}
      ${sets.length ? `<p style="margin:0"><b>${esc(res.text)}</b> · ${sets.map(s => `${s.us}–${s.them}`).join(", ")}</p>` : ""}
      ${m.scoring ? `<p class="muted small" style="margin:0">Scoring: ${m.scoring === "points" ? "every point" : "final set scores only"}</p>` : ""}`,
    buttons: [{ label: "Track this match", value: "track", cls: "primary" }, { label: "Edit", value: "edit" },
      { label: "Set scores", value: "scores" }, { label: "Delete", value: "delete" }, { label: "Close", value: null }],
  });
  if (r.value === "track") {
    model.setCurrentMatch(m.id);
    let cur = db.get("matches", m.id);
    if (!cur.scoring) { cur = await chooseScoring(cur); if (!cur) { ctx.refresh(); return; } }
    if (cur.status === "played") db.update("matches", m.id, { status: "in progress" });
    ctx.go("serve");
  } else if (r.value === "edit") {
    const e = await sheet({ title: "Edit match", body: matchForm(m),
      buttons: [{ label: "Save", value: true, cls: "primary" }, { label: "Cancel", value: null }], check: checkForm });
    if (e.value) { db.update("matches", m.id, readForm(e.el)); toast("Match saved."); ctx.refresh(); }
  } else if (r.value === "scores") editScores(m, ctx);
  else if (r.value === "delete") {
    const n = model.actionsFor(m.id).length;
    if (await ask(`Delete the match vs ${m.opponent}${n ? ` and its ${n} recorded stats` : ""}? This can't be undone.`, "Delete", true)) {
      for (const s of model.setsFor(m.id)) db.remove("sets", s.id);
      for (const a of model.actionsFor(m.id)) db.remove("actions", a.id);
      db.remove("matches", m.id);
      if (db.getLocal("current_match") === m.id) model.setCurrentMatch(null);
      toast("Match deleted."); ctx.refresh();
    }
  }
}

export function render(main, ctx) {
  const team = model.currentTeam();
  if (!team) {
    main.innerHTML = `<section class="card"><h2>Schedule</h2><p>Create a team first, then add its matches here.</p>
      <button class="btn primary" type="button" id="to-team">Create a team</button></section>`;
    $("#to-team", main).onclick = () => ctx.go("team");
    return;
  }
  const list = model.matchesFor(team.id), cur = db.getLocal("current_match"), t = today();
  const next = list.find(m => m.date >= t && m.status !== "played");
  main.innerHTML = `<section class="card">
      <div class="card-head"><h2>Schedule</h2><span class="grow"></span>
        <button class="btn small primary" type="button" id="add">+ Add match</button></div>
      <p class="muted small" style="margin:0">${esc(team.name)}${team.season ? " · " + esc(team.season) : ""} · ${list.length} match${list.length === 1 ? "" : "es"}</p>
      <div class="list">${list.length ? list.map(m => {
        const res = model.matchResult(m.id);
        const pill = m.id === cur && m.status !== "played" ? `<span class="pill live">Tracking</span>`
          : m.status === "played" ? `<span class="pill done">${esc(res.text || "Played")}</span>`
          : m === next ? `<span class="pill">Next</span>` : "";
        return `<button type="button" class="item" data-m="${esc(m.id)}">
          <div class="main-txt"><b>vs ${esc(m.opponent)}</b>
            <div class="sub">${esc(dayName(m.date, true))} ${esc(fmtDate(m.date))}${m.time ? " · " + esc(fmtTime(m.time)) : ""}${m.location ? " · " + esc(m.location) : ""}</div>
            ${m.event ? `<div class="sub">${esc(m.event)}</div>` : ""}</div>
          ${pill}<span class="chev">›</span></button>`;
      }).join("") : `<p class="muted">No matches yet. Tap <b>+ Add match</b> to start the season schedule.</p>`}</div>
    </section>`;
  $("#add", main).onclick = () => addMatch(team, ctx);
  for (const b of $$("[data-m]", main)) b.onclick = () => openMatch(db.get("matches", b.dataset.m), ctx);
}
