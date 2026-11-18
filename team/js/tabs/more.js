// The More menu.

import { $$, esc } from "../ui.js";

const ITEMS = [
  ["court", "Court", "Lineup, rotation, substitutions and the libero"],
  ["board", "Board", "Match day: who's serving, passing and hitting well, weakest first"],
  ["scout", "Scout", "Rate other teams' passers to find who to serve at"],
  ["team", "Team", "Teams, coaches, club players and this team's roster"],
  ["stats", "Stats", "Serve, pass, attack, block, set and playing time"],
  ["sync", "Sync", "Send data to Home Base, or bring in a file"],
  ["guide", "Guide", "How to set up and use the app"],
  ["about", "About & terms", "Version, open-source license, terms of use, replay the welcome"],
  ["work", "Work", "Officiating duties and the rotation"],
  ["links", "Links", "Your helpful links"],
  ["share", "Share the app", "QR code and link to put the app on another coach's phone"],
];

export function render(main, ctx) {
  main.innerHTML = `<section class="card"><h2>More</h2><div class="list">${ITEMS.map(([v, t, d]) => `
    <button type="button" class="item" ${v ? `data-v="${v}"` : "disabled"} style="${v ? "" : "opacity:.5;cursor:default"}">
      <span class="main-txt"><b>${esc(t)}</b><span class="sub">${esc(d)}</span></span>${v ? `<span class="chev">›</span>` : ""}</button>`).join("")}
    </div></section>`;
  for (const b of $$("[data-v]", main)) b.onclick = () => ctx.go(b.dataset.v);
}
