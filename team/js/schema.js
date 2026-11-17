// Table definitions for the Team app. Home Base (home_base.py) uses the same tables and columns.
// To add a field later: add it to the list here and in home_base.py. Old rows simply don't have it yet.
// Every table also has the COMMON columns, which make syncing between devices safe.

export const APP_VERSION = "v1.0.2";
export const SCHEMA_VERSION = 2;          // bump when a new table is added
export const SYNC_FORMAT = "vbteam-sync";
export const SYNC_FORMAT_VERSION = 1;

export const COMMON = ["id", "created_at", "updated_at", "device", "deleted"];

export const TABLES = {
  teams:     ["name", "season", "notes"],
  staff:     ["team_id", "role", "first", "last", "phone", "email"],
  players:   ["first", "last", "number", "position", "age", "birth_date", "notes"],
  roster:    ["team_id", "player_id", "number", "position", "rot"],
  matches:   ["team_id", "date", "time", "opponent", "location", "event", "status", "scoring", "cur_set", "notes"],
  sets:      ["match_id", "set_no", "us", "them"],
  actions:   ["match_id", "set_no", "player_id", "skill", "result", "tap", "us", "them", "court_pos", "serving", "lineup", "rot_no"],
  court_log: ["match_id", "set_no", "player_id", "court_pos", "event", "us", "them", "lineup", "rot_no", "subs", "tap"],
  duties:    ["name", "sort"],
  work_log:  ["team_id", "match_id", "player_id", "duty_id", "status", "session", "date", "label", "slot"],
  links:     ["title", "url", "category", "sort"],
  settings:  ["key", "value"],
  // Scouting other teams (kept apart from your own teams and stats)
  scout_teams:   ["name", "notes"],
  scout_players: ["scout_team_id", "number", "position", "comment"],
  scout_matches: ["date", "team1_id", "team2_id", "location"],
  scout_passes:  ["match_id", "scout_team_id", "scout_player_id", "rating", "tap"],
};

// Match-day board colours: below the first number is red, below the second amber, otherwise green.
export const BOARD_CUTS = { pass: [1.5, 2.0], serve: [70, 85], hit: [0, 0.15] };

export const POSITIONS = ["Setter", "Pin", "Middle", "Right Side", "Libero", "DS"];
export const ROT_COUNTS = ["", "3", "6"];
export const DEFAULT_ROLES = { 1: "Setter 1", 2: "Pin 1", 3: "Middle 1", 4: "Opposite 1", 5: "Pin 2", 6: "Middle 2" };
// Short column labels for the work matrix, by duty order.
export const DUTY_SHORT = ["Score", "LibTr", "Board", "LJ1A", "LJ1B", "LJ2A", "LJ2B", "LJ3A", "LJ3B", "Swing"];
export const STAFF_ROLES = ["Head coach", "Assistant coach 1", "Assistant coach 2", "Assistant coach 3"];

// skill -> allowed results, in button order
export const SKILLS = {
  serve:   ["ace", "in", "out"],
  receive: ["0", "1", "2", "3"],
  attack:  ["kill", "in play", "error"],
  block:   ["solo", "assist", "error"],
  set:     ["assist", "error"],
  point:   ["us", "them"],
};

// The 10 officiating duties, in rotation order. Fixed ids so every device shares the same rows.
export const DUTIES = [
  "Score keeper", "Libero tracker", "Scoreboard",
  "Line Judge 1A", "Line Judge 1B", "Line Judge 2A", "Line Judge 2B", "Line Judge 3A", "Line Judge 3B",
  "Swing Helper",
].map((name, i) => ({
  id: "duty-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name, sort: i + 1,
  created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", device: "seed", deleted: 0,
}));
