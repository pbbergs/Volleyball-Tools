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

// view name -> [render function, bottom tab it belongs to]
const VIEWS = {
  serve:    [m => track.render(m, ctx, "serve"), "serve"],
  receive:  [m => track.render(m, ctx, "receive"), "receive"],
  attack:   [m => track.renderAttack(m, ctx), "attack"],
  schedule: [m => schedule.render(m, ctx), "schedule"],
  more:     [m => more.render(m, ctx), "more"],
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
const hosted = /^https?:$/.test(location.protocol);
async function checkForUpdate() {
  if (!hosted || document.visibilityState !== "visible") return;
  try {
    const res = await fetch("./index.html", { cache: "reload" });
    if (!res.ok) return;
    const m = (await res.text()).match(/id="ver">(v[\w.]+)</);
    if (m && m[1] !== APP_VERSION) { $("#update-text").textContent = `New version available (${m[1]})`; $("#update").hidden = false; }
  } catch {}
}
$("#update-btn").addEventListener("click", () => location.reload());

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
