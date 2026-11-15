// Serve and serve receive stats by match, set or season. (Attack, Block, Set and playing time: Phase 2.)

import * as db from "../db.js";
import * as model from "../model.js";
import { $, esc, fmtDate } from "../ui.js";

let pickMatch = "season", pickSet = "all";

export function render(main, ctx) {
  const team = model.currentTeam();
  if (!team) { main.innerHTML = `<section class="card"><h2>Stats</h2><p>Create a team first.</p></section>`; return; }
  const matches = model.matchesFor(team.id).filter(m => model.actionsFor(m.id).length);
  if (pickMatch !== "season" && !matches.some(m => m.id === pickMatch)) pickMatch = "season";
  const ids = new Set(pickMatch === "season" ? matches.map(m => m.id) : [pickMatch]);
  const acts = db.where("actions", a => ids.has(a.match_id) && (pickSet === "all" || String(a.set_no) === pickSet));
  const roster = model.rosterFor(team.id);
  const rows = roster.map(({ r, p }) => ({ r, p, s: model.tally(acts.filter(a => a.player_id === p.id)) }));
  const teamS = model.tally(acts.filter(a => roster.some(x => x.p.id === a.player_id)));
  const flagSrv = s => s.serves > 3 && s.out / s.serves > 0.5;
  const flagPass = s => s.passes > 3 && s.passPts / s.passes < 1;
  const line = (label, s, isTeam) => `<tr class="${isTeam ? "team" : ""}"><td>${label}</td>
      <td>${s.serves || "-"}</td><td>${s.serves ? s.ace : "-"}</td><td>${s.serves ? s.in : "-"}</td><td>${s.serves ? s.out : "-"}</td>
      <td class="${!isTeam && flagSrv(s) ? "flag" : ""}">${s.srvPct ?? "-"}${s.srvPct != null ? "%" : ""}</td>
      <td>${s.passes || "-"}</td><td class="${!isTeam && flagPass(s) ? "flag" : ""}">${s.avg ?? "-"}</td></tr>`;

  main.innerHTML = `<section class="card">
      <h2>Stats</h2>
      <div class="grid2">
        <label class="field">Match<select id="pm"><option value="season">Season (all matches)</option>
          ${matches.map(m => `<option value="${esc(m.id)}"${m.id === pickMatch ? " selected" : ""}>${esc(fmtDate(m.date, { month: "short", day: "numeric" }))} vs ${esc(m.opponent)}</option>`).join("")}</select></label>
        <label class="field">Set<select id="ps"><option value="all">All sets</option>
          ${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${String(n) === pickSet ? " selected" : ""}>Set ${n}</option>`).join("")}</select></label>
      </div>
      <div class="scroll"><table>
        <thead><tr><th>Player</th><th>Serves</th><th>Aces</th><th>In</th><th>Out</th><th>Serve %</th><th>Passes</th><th>Avg pass</th></tr></thead>
        <tbody>${rows.map(x => line(`#${esc(x.r.number ?? "")} ${esc(model.fullName(x.p))}`, x.s)).join("")}${line("Team", teamS, true)}</tbody>
      </table></div>
      <p class="muted small" style="margin:0">Serve % counts aces and in serves out of all serves. Avg pass is the mean 0–3 rating.
        Shaded: more than 3 serves and over half out, or more than 3 passes averaging under 1.</p>
      <p class="muted small" style="margin:0">Attack, block, set and playing-time stats arrive in Phase 2.</p>
    </section>`;
  $("#pm", main).onchange = e => { pickMatch = e.target.value; ctx.refresh(); };
  $("#ps", main).onchange = e => { pickSet = e.target.value; ctx.refresh(); };
}
