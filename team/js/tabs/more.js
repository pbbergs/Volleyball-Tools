// The More menu.

import { $$, esc } from "../ui.js";

const ITEMS = [
  ["court", "Court", "Lineup, rotation, substitutions and the libero"],
  ["team", "Team", "Teams, coaches, club players and this team's roster"],
  ["stats", "Stats", "Serve, pass, attack, block, set and playing time"],
  ["sync", "Sync", "Send data to Home Base, or bring in a file"],
  ["guide", "Guide", "How to set up and use the app"],
  [null, "Work", "Officials duties and the rotation · Phase 3"],
  [null, "Links", "Your helpful links · Phase 3"],
];

export function render(main, ctx) {
  main.innerHTML = `<section class="card"><h2>More</h2><div class="list">${ITEMS.map(([v, t, d]) => `
    <button type="button" class="item" ${v ? `data-v="${v}"` : "disabled"} style="${v ? "" : "opacity:.5;cursor:default"}">
      <span class="main-txt"><b>${esc(t)}</b><span class="sub">${esc(d)}</span></span>${v ? `<span class="chev">›</span>` : ""}</button>`).join("")}
    </div></section>`;
  for (const b of $$("[data-v]", main)) b.onclick = () => ctx.go(b.dataset.v);
}
