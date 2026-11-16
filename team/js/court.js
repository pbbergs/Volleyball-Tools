// Court rules: lineup by position, court roles, rotation, substitutions (15 per set, libero not counted),
// libero front-row notice, rotation-count-3 and libero-for-Middle prompts, and who is serving.
//
// The live court for each match and set is kept on this device (the coach running the Court tab).
// Every change is also written to court_log with a snapshot of all six positions, and every rally
// stores the lineup it was played with. Playing time is counted from those snapshots.

import * as db from "./db.js";
import * as model from "./model.js";
import { DEFAULT_ROLES } from "./schema.js";

export const SUB_LIMIT = 15;
export const FRONT = [4, 3, 2], BACK = [5, 6, 1];
const key = (m, set) => `court:${m.id}:${set ?? model.curSet(m)}`;

function blank() {
  return { lineup: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null }, roles: { ...DEFAULT_ROLES },
           subs: 0, rot: 0, hist: [], prompts: [], first: null, auto: true };
}
export function state(m, set) {
  const s = db.getLocal(key(m, set));
  return s ? { ...blank(), ...JSON.parse(JSON.stringify(s)) } : blank();
}
export const save = (m, s) => db.setLocal(key(m), s);

export const snapshot = s => [1, 2, 3, 4, 5, 6].map(p => s.lineup[p] || null);
export const onCourt = s => new Set(Object.values(s.lineup).filter(Boolean));
export const full = s => [1, 2, 3, 4, 5, 6].every(p => s.lineup[p]);
export const posOf = (s, pid) => +(Object.keys(s.lineup).find(p => s.lineup[p] === pid) || 0);

// What a box shows: the role of the slot, with the setter/opposite row swap, or "Libero".
export function dispRole(m, s, pos) {
  if (model.isLibero(m.team_id, s.lineup[pos])) return "Libero";
  const role = s.roles[pos] || "";
  if (role === "Setter 1") return BACK.includes(pos) ? "Setter 1" : "Opposite 2";
  if (role === "Opposite 1") return FRONT.includes(pos) ? "Opposite 1" : "Setter 2";
  return role;
}

function remember(s, tap = null) {
  s.hist.push({ lineup: { ...s.lineup }, roles: { ...s.roles }, subs: s.subs, rot: s.rot, tap });
  if (s.hist.length > 30) s.hist.shift();
}
function log(m, s, event, pos, pid, tap = null) {
  const sc = m.scoring === "points" ? model.liveScore(m.id, model.curSet(m)) : { us: null, them: null };
  db.insert("court_log", { match_id: m.id, set_no: model.curSet(m), player_id: pid || null, court_pos: pos || null, event,
    us: sc.us, them: sc.them, lineup: JSON.stringify(snapshot(s)), rot_no: s.rot, subs: s.subs, tap });
}
const benchLibero = (m, s) => model.rosterFor(m.team_id).map(x => x.p.id).find(id => !onCourt(s).has(id) && model.isLibero(m.team_id, id)) || null;

// Libero in the front row: Rotate stays off until she's out.
export function liberoFront(m, s) {
  const p = FRONT.find(pos => model.isLibero(m.team_id, s.lineup[pos]));
  return p ? { pos: p, pid: s.lineup[p] } : null;
}

// Put a bench player at a position. Returns { ok } or { error }.
export function place(m, s, pos, pid) {
  const prev = s.lineup[pos];
  if (prev === pid) return { ok: true };
  const counted = !!prev && !model.isLibero(m.team_id, prev) && !model.isLibero(m.team_id, pid);
  if (counted && s.subs >= SUB_LIMIT)
    return { error: `All ${SUB_LIMIT} substitutions have been used in set ${model.curSet(m)}. No more substitutions are allowed.` };
  remember(s);
  const from = posOf(s, pid); if (from) s.lineup[from] = null;   // moving within the court
  s.lineup[pos] = pid;
  if (counted) s.subs++;
  s.prompts = s.prompts.filter(p => p.pos !== pos);
  log(m, s, prev ? (counted ? "sub" : "libero") : "in", pos, pid);
  save(m, s);
  return { ok: true, counted };
}

export function takeOff(m, s, pos) {
  if (!s.lineup[pos]) return;
  remember(s);
  const pid = s.lineup[pos]; s.lineup[pos] = null;
  s.prompts = s.prompts.filter(p => p.pos !== pos);
  log(m, s, "out", pos, pid);
  save(m, s);
}

// Clockwise: 4->3, 3->2, 2->1, 1->6, 6->5, 5->4. Roles move with their slot.
export function rotate(m, s, tap = null) {
  if (liberoFront(m, s)) return { error: "Rotate is off while the libero is in the front row." };
  remember(s, tap);
  const L = s.lineup, R = s.roles;
  s.lineup = { 1: L[2], 2: L[3], 3: L[4], 4: L[5], 5: L[6], 6: L[1] };
  s.roles = { 1: R[2], 2: R[3], 3: R[4], 4: R[5], 5: R[6], 6: R[1] };
  s.rot++;
  // Prompts for players who just crossed rows: 2 -> 1 (front to back) and 5 -> 4 (back to front).
  const prompts = [];
  if (s.subs < SUB_LIMIT || benchLibero(m, s)) {
    for (const [pos, dir] of [[1, "from the front row to the back row"], [4, "from the back row to the front row"]]) {
      const pid = s.lineup[pos];
      if (!pid || model.isLibero(m.team_id, pid)) continue;
      const rr = model.rosterRow(m.team_id, pid);
      if (pos === 1 && model.teamPos(m.team_id, pid) === "Middle" && benchLibero(m, s)) {
        prompts.unshift({ type: "libero", pos, pid, lib: benchLibero(m, s) });
      } else if (String(rr?.rot || "") === "3" && s.subs < SUB_LIMIT) prompts.push({ type: "rot3", pos, pid, dir });
    }
  }
  s.prompts = prompts;
  log(m, s, "rotate", null, null, tap);
  save(m, s);
  return { ok: true };
}

export function undoLineup(m, s) {
  const h = s.hist.pop();
  if (!h) return false;
  Object.assign(s, { lineup: h.lineup, roles: h.roles, subs: h.subs, rot: h.rot, prompts: [] });
  log(m, s, "undo", null, null);
  save(m, s);
  return true;
}

export function dismissPrompt(m, s) { s.prompts.shift(); save(m, s); }

// ---------- serving (point-by-point matches) ----------
export function serving(m, s) {
  const pts = model.actionsFor(m.id, a => a.skill === "point" && Number(a.set_no) === model.curSet(m))
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  return pts.length ? pts[pts.length - 1].result : s.first;
}

// Record a tap with the court attached. In point-by-point matches with a full lineup:
// winning a rally while receiving is a side out, so the court rotates (when "rotate automatically" is on);
// losing one on our serve checks whether the libero should come in for a Middle at position 1.
export function record(m, pid, skill, result) {
  const s = state(m);
  const before = m.scoring === "points" ? serving(m, s) : null;
  const pos = pid ? posOf(s, pid) || null : null;
  const r = model.record(m, pid, skill, result, {
    serving: before, lineup: JSON.stringify(snapshot(s)), rot_no: s.rot, court_pos: pos });
  let rotated = false;
  if (r.point && m.scoring === "points") {
    const s2 = state(m);
    if (r.point === "us" && before === "them" && s2.auto && full(s2) && !liberoFront(m, s2)) { rotated = !rotate(m, s2, r.tap).error; }
    else if (r.point === "them" && before === "us" && full(s2) && model.teamPos(m.team_id, s2.lineup[1]) === "Middle" && benchLibero(m, s2)) {
      s2.prompts = [{ type: "libero", pos: 1, pid: s2.lineup[1], lib: benchLibero(m, s2) }, ...s2.prompts.filter(p => p.type !== "libero")];
      save(m, s2);
    }
  }
  return { ...r, rotated, sideOut: r.point === "us" && before === "them" };
}

// Undo the last tap; if that tap rotated the court, rotate it back too.
export function undo(m) {
  const rows = model.undoLast(m);
  if (!rows) return null;
  const s = state(m), top = s.hist[s.hist.length - 1];
  if (top && top.tap && top.tap === rows[0].tap) undoLineup(m, s);
  return rows;
}

export const setFirstServe = (m, who) => { const s = state(m); s.first = who; save(m, s); };
export const setAuto = (m, on) => { const s = state(m); s.auto = on; save(m, s); };
export { benchLibero };
