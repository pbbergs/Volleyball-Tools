// More -> About & terms: version, open-source license, the terms (and when you agreed), replay the welcome.

import * as db from "../db.js";
import { APP_VERSION } from "../schema.js";
import { TERMS_VERSION, TERMS_SUMMARY, SOURCE_URL } from "../terms.js";
import { showFullTerms } from "../welcome.js";
import { $, esc } from "../ui.js";

export function render(main, ctx) {
  const a = db.getLocal("terms_accepted");
  const when = a?.at ? new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
  main.innerHTML = `<section class="card">
      <h2>About &amp; terms</h2>
      <p style="margin:0"><b>Team ${esc(APP_VERSION)}</b>, part of Volleyball Tools.</p>
      <p class="small" style="margin:0">Free and open source under the <b>MIT License</b>, made by the Volleyball Tools contributors.
        <a href="${esc(SOURCE_URL)}" target="_blank" rel="noopener">Source code</a></p>
    </section>
    <section class="card">
      <h3>Terms of use <span class="muted small">(version ${esc(TERMS_VERSION)})</span></h3>
      <ul class="ob-list">${TERMS_SUMMARY.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      <p class="muted small" style="margin:0">${a?.version === TERMS_VERSION ? `You agreed on this phone on ${esc(when)}.` : "Not agreed on this phone yet."}</p>
      <div class="row"><button class="btn" type="button" id="full">Read the full terms</button></div>
    </section>
    <section class="card">
      <h3>The welcome</h3>
      <p class="small" style="margin:0">See the introduction again: what the app does, installing it on the Home Screen, and the terms.</p>
      <div class="row"><button class="btn" type="button" id="replay">Replay the welcome</button></div>
    </section>`;
  $("#full", main).onclick = showFullTerms;
  $("#replay", main).onclick = () => ctx.go("welcome");
}
