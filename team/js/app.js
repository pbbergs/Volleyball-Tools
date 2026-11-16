// Start-up, navigation, update check and offline support.

import * as db from "./db.js";
import { $, $$, esc, toast, sheet } from "./ui.js";
import { APP_VERSION } from "./schema.js";
import * as model from "./model.js";
import * as track from "./tabs/track.js";
import * as schedule from "./tabs/schedule.js";
import * as team from "./tabs/team.js";
import * as stats from "./tabs/stats.js";
import * as syncTab from "./tabs/sync.js";
import * as guide from "./tabs/guide.js";
import * as more from "./tabs/more.js";
import * as courtTab from "./tabs/court.js";

// view name -> [render function, bottom tab it belongs to]
const VIEWS = {
  serve:    [m => track.render(m, ctx, "serve"), "serve"],
  receive:  [m => track.render(m, ctx, "receive"), "receive"],
  attack:   [m => track.renderAttack(m, ctx), "attack"],
  schedule: [m => schedule.render(m, ctx), "schedule"],
  more:     [m => more.render(m, ctx), "more"],
  court:    [m => courtTab.render(m, ctx), "more"],
  team:     [m => team.render(m, ctx), "more"],
  stats:    [m => stats.render(m, ctx), "more"],
  sync:     [m => syncTab.render(m, ctx), "more"],
  guide:    [m => guide.render(m, ctx), "more"],
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
export const FILES = ["./", "./index.html", "./styles.css", "./icon.png", "./sw.js",
  "./js/app.js", "./js/db.js", "./js/schema.js", "./js/sync.js", "./js/ui.js", "./js/model.js", "./js/match.js", "./js/court.js",
  "./js/tabs/track.js", "./js/tabs/schedule.js", "./js/tabs/team.js", "./js/tabs/stats.js", "./js/tabs/sync.js",
  "./js/tabs/more.js", "./js/tabs/guide.js", "./js/tabs/court.js"];
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

// ---------- start ----------
async function boot() {
  $("#ver").textContent = APP_VERSION;
  if (hosted) $("#home-link").hidden = false;
  await db.open(msg => toast(msg));
  if (!db.getLocal("device_name")) {
    const r = await sheet({
      title: "Welcome",
      body: `<p class="sheet-msg">Give this device a name. It appears on sync files so you can tell whose data is whose.</p>
             <label class="field">Device name<input type="text" id="dev-name" placeholder="e.g. Coach Paul iPhone" maxlength="40"></label>`,
      buttons: [{ label: "Save", value: true, cls: "primary" }],
      check: el => ($("#dev-name", el).value.trim() ? true : "Type a name for this device."),
    });
    const name = r.value ? $("#dev-name", r.el).value.trim() : "";
    await db.setLocal("device_name", name || "iPhone");
  }
  window.addEventListener("hashchange", route);
  route();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1"))
    navigator.serviceWorker.register("sw.js").catch(() => {});
  document.addEventListener("visibilitychange", checkForUpdate);
  setTimeout(checkForUpdate, 2000);
}
boot();

export { ctx, esc };
