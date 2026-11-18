// Start-up, navigation, update check and offline support.

import * as db from "./db.js";
import { $, $$, esc, toast, sheet } from "./ui.js";
import { APP_VERSION, RELEASE_NOTES } from "./schema.js";
import * as model from "./model.js";
import * as track from "./tabs/track.js";
import * as schedule from "./tabs/schedule.js";
import * as team from "./tabs/team.js";
import * as stats from "./tabs/stats.js";
import * as syncTab from "./tabs/sync.js";
import * as guide from "./tabs/guide.js";
import * as more from "./tabs/more.js";
import * as courtTab from "./tabs/court.js";
import * as work from "./tabs/work.js";
import * as links from "./tabs/links.js";
import * as board from "./tabs/board.js";
import * as scout from "./tabs/scout.js";
import * as share from "./tabs/share.js";
import * as about from "./tabs/about.js";
import * as rotation from "./tabs/rotation.js";
import { runWelcome, termsAccepted } from "./welcome.js";

// view name -> [render function, bottom tab it belongs to]
const VIEWS = {
  serve:    [m => track.render(m, ctx, "serve"), "serve"],
  receive:  [m => track.render(m, ctx, "receive"), "receive"],
  attack:   [m => track.renderAttack(m, ctx), "attack"],
  schedule: [m => schedule.render(m, ctx), "schedule"],
  more:     [m => more.render(m, ctx), "more"],
  court:    [m => courtTab.render(m, ctx), "more"],
  rotation: [m => rotation.render(m, ctx), "more"],
  team:     [m => team.render(m, ctx), "more"],
  stats:    [m => stats.render(m, ctx), "more"],
  work:     [m => work.render(m, ctx), "more"],
  links:    [m => links.render(m, ctx), "more"],
  sync:     [m => syncTab.render(m, ctx), "more"],
  guide:    [m => guide.render(m, ctx), "more"],
  board:    [m => board.render(m, ctx), "more"],
  scout:    [m => scout.render(m, ctx), "more"],
  share:    [m => share.render(m, ctx), "more"],
  about:    [m => about.render(m, ctx), "more"],
  welcome:  [m => runWelcome(m, "replay").then(() => ctx.go("about")), "more"],
};

let view = "serve";
const ctx = {
  go(v) { if (location.hash !== "#" + v) location.hash = v; else show(v); },
  refresh() { show(view); },
  get view() { return view; },
};

function show(v) {
  if (!VIEWS[v]) v = "serve";
  view = v;
  const main = $("#main");
  main.innerHTML = "";
  VIEWS[v][0](main);
  for (const b of $$(".tabbar button")) b.toggleAttribute("aria-current", b.dataset.tab === VIEWS[v][1]);
  const t = model.currentTeam();
  $("#team-name").textContent = t ? t.name : "";
  const logo = model.clubLogo(), img = $("#club-logo");
  if (logo) { if (img.src !== logo) img.src = logo; img.hidden = false; } else img.hidden = true;
}

function route() {
  const v = (location.hash || "").slice(1);
  show(VIEWS[v] ? v : (model.currentTeam() ? "serve" : "team"));
  window.scrollTo(0, 0);
}

for (const b of $$(".tabbar button")) b.addEventListener("click", () => ctx.go(b.dataset.tab));

// ---------- update check (when served from a web address) ----------
// The bar appears only when the new version is fully published (page and code agree).
// Update fetches a fresh copy of every file before reloading, so nothing old is left behind.
export const FILES = ["./", "./index.html", "./styles.css", "./icon.png", "./icon-192.png", "./icon-512.png", "./manifest.webmanifest", "./sw.js",
  "./js/app.js", "./js/db.js", "./js/schema.js", "./js/sync.js", "./js/ui.js", "./js/model.js", "./js/match.js", "./js/court.js",
  "./js/tabs/track.js", "./js/tabs/schedule.js", "./js/tabs/team.js", "./js/tabs/stats.js", "./js/tabs/sync.js",
  "./js/tabs/more.js", "./js/tabs/guide.js", "./js/tabs/court.js", "./js/tabs/work.js", "./js/tabs/links.js",
  "./js/tabs/board.js", "./js/tabs/scout.js", "./js/tabs/share.js", "./js/qr.js", "./js/tabs/about.js", "./js/welcome.js", "./js/terms.js", "./js/tabs/rotation.js", "./js/planui.js"];
const hosted = /^https?:$/.test(location.protocol);
async function serverVersion() {
  const [a, b] = await Promise.all([
    fetch("./index.html", { cache: "reload" }).then(r => (r.ok ? r.text() : "")),
    fetch("./js/schema.js", { cache: "reload" }).then(r => (r.ok ? r.text() : "")),
  ]);
  const v1 = a.match(/id="ver">(v[\w.]+)</)?.[1], v2 = b.match(/APP_VERSION = "(v[\w.]+)"/)?.[1];
  return v1 && v1 === v2 ? v1 : null;
}
async function checkForUpdate() {
  if (!hosted || document.visibilityState !== "visible") return;
  try {
    const v = await serverVersion();
    if (v && v !== APP_VERSION) { $("#update-text").textContent = `New version available (${v})`; $("#update").hidden = false; }
  } catch {}
}
$("#update-btn").addEventListener("click", async () => {
  const btn = $("#update-btn"); btn.disabled = true; btn.textContent = "Updating…";
  try {
    await Promise.all(FILES.map(f => fetch(f, { cache: "reload" }).catch(() => {})));
    if (window.caches) for (const k of await caches.keys()) if (k.startsWith("vbteam-")) await caches.delete(k);
    const reg = await navigator.serviceWorker?.getRegistration?.(); await reg?.update?.();
  } catch {}
  location.reload();
});

// ---------- what's new ----------
const vparts = v => String(v || "").replace(/^v/, "").split(".").map(n => +n || 0);
const newer = (a, b) => { const x = vparts(a), y = vparts(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
function showNotes(since) {
  const list = RELEASE_NOTES.filter(([v]) => (since ? newer(v, since) : true) && !newer(v, APP_VERSION)).slice(0, since ? 99 : 4);
  if (!list.length) return;
  sheet({ title: since ? `What's new in ${APP_VERSION}` : "What's new",
    body: list.map(([v, notes]) => `<h3 class="wn-v">${esc(v)}</h3><ul class="wn">${notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>`).join(""),
    buttons: [{ label: "OK", value: true, cls: "primary" }] });
}

// ---------- start ----------
async function boot() {
  $("#ver").textContent = APP_VERSION;
  if (hosted) $("#home-link").hidden = false;
  await db.open(msg => toast(msg));
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1"))
    navigator.serviceWorker.register("sw.js").catch(() => {});
  document.addEventListener("visibilitychange", checkForUpdate);
  setTimeout(checkForUpdate, 2000);
  // A new phone gets the full welcome; an existing one only sees the terms when they are new or have changed.
  const brandNew = !db.getLocal("device_name");
  let start = null;
  if (brandNew) start = await runWelcome($("#main"), "new");
  else if (!termsAccepted()) await runWelcome($("#main"), "terms");
  if (start === "setup") location.hash = "sync";
  else if (start === "new") location.hash = "team";
  window.addEventListener("hashchange", route);
  route();
  if (start === "setup") toast("Tap Import file and choose the setup file you were sent.");
  if (start === "new") toast("Tap Create a team to get started.");
  // Once per update: show what changed since the version this device last saw (not on a brand-new device).
  const seen = db.getLocal("seen_version");
  if (!brandNew && seen !== APP_VERSION) showNotes(seen || RELEASE_NOTES.find(([v]) => newer(APP_VERSION, v))?.[0] || "v0");
  if (seen !== APP_VERSION) db.setLocal("seen_version", APP_VERSION);
  $("#ver").setAttribute("role", "button"); $("#ver").title = "What's new";
  $("#ver").addEventListener("click", () => showNotes(null));
}
boot();

export { ctx, esc };
