// The complete setup and how-to guide, built into the app.

import { $$ } from "../ui.js";

const SECTIONS = [
["what", "What the app does", `
<p>The Team app tracks your volleyball team on your iPhone: the roster, the season schedule, and serve and serve-receive stats during matches. Each coach can use it on their own phone. A program on your PC called <b>Home Base</b> keeps the master database for the whole club and collects everyone's data.</p>
<ul>
  <li><b>Serve:</b> Ace, In, Out for each serve.</li>
  <li><b>Receive:</b> rate each pass 0, 1, 2 or 3 (3 = perfect, 2 = good, 1 = poor but playable, 0 = shanked, overpassed or aced).</li>
  <li><b>Attack:</b> Kill, In play, Error; <b>Block:</b> Solo, Assist, Error; <b>Set:</b> Assist, Error.</li>
  <li><b>Court:</b> the lineup by position, rotation, substitutions and the libero rules; it also counts each player's playing time.</li>
  <li><b>Schedule:</b> every match of the year with day, date, opponent, location and optional time.</li>
  <li><b>Team:</b> teams, coaches, the club's players and each team's roster.</li>
  <li><b>Stats:</b> by match, by set or for the season, including playing time.</li>
  <li><b>Sync:</b> send data to Home Base and bring in data from it or from other coaches.</li>
</ul>`],

["install", "Put the app on your iPhone", `
<ol>
  <li>Open <b>Safari</b> and go to <code>pbbergs.github.io/Volleyball-Tools/</code>. It must be Safari.</li>
  <li>Tap <b>Share</b> (square with an up arrow), then <b>Add to Home Screen</b>, then <b>Add</b>. This adds the Volleyball Tools menu.</li>
  <li>Open <b>Volleyball Tools</b> from the Home Screen and tap <b>Team</b>.</li>
  <li>Always open the app the same way. Data saved from the Home Screen icon is separate from data in Safari itself.</li>
</ol>
<p>After you've opened it once, the app works with no internet at the gym. When a new version is posted, a bar at the bottom says <b>New version available</b>; tap <b>Update</b>. Your data stays.</p>`],

["setup", "First-time setup", `
<ol>
  <li><b>Name this device</b> when the app asks, for example <i>Coach Paul iPhone</i>. Change it later on More → Sync.</li>
  <li><b>Create your team</b> on More → Team: team name and season.</li>
  <li><b>Coaches:</b> fill in the head coach and up to three assistant coaches on the same page.</li>
  <li><b>Players:</b> tap <b>+ New player</b>, or <b>Import CSV…</b> to load a whole list (see the next section). New players are added to the club list and to the team you're working with.</li>
  <li><b>Roster:</b> players already in the club list can be added with <b>+ Add from club list</b>. Tap a roster player to change her number, position or <b>rotation count</b> on this team, or to remove her from the team. Set the libero's position to <b>Libero</b> so the court rules know her.</li>
  <li><b>Attack:</b> Kill, In play, Error; <b>Block:</b> Solo, Assist, Error; <b>Set:</b> Assist, Error.</li>
  <li><b>Court:</b> the lineup by position, rotation, substitutions and the libero rules; it also counts each player's playing time.</li>
  <li><b>Schedule:</b> on the Schedule tab, tap <b>+ Add match</b> for each match: date, optional time, opponent, location, and an optional event or tournament name. The day of the week is filled in for you.</li>
</ol>
<p>Setting up a second team? Tap <b>+ New team</b> on the Team page. When there's more than one team, a <b>Working with</b> menu picks which one the other tabs show.</p>
<p>Already set up on another phone or in Home Base? Skip all of this: import the setup file (More → Sync → Import file).</p>`],

["csv", "Player CSV files", `
<p>One player per line. With a header row, the columns can be in any order:</p>
<pre>First Name,Last Name,Number,Position,Age,Team
Ava,Smith,7,Setter,13,13U Gold
Mia,Jones,12,Pin,13,13U Gold
Zoe,Lee,3,Libero,12,12U Blue</pre>
<ul>
  <li>Without a header, the order must be: first name, last name, number, position, age, team.</li>
  <li>Only first name is required. Positions: Setter, Pin, Middle, Right Side, Libero, DS.</li>
  <li><b>Team</b> puts each player on that team, creating the team if it doesn't exist. With no Team column, players go on the team you're working with.</li>
  <li>Players already in the club list (same first and last name) aren't added twice.</li>
  <li>Tryouts: put tryout numbers (101, 102…) in the Number column, or in First Name if you don't know names yet.</li>
  <li>In Excel use <b>Save As → CSV</b>. To get the file onto the iPhone, email it to yourself and use Share → <b>Save to Files</b>.</li>
</ul>`],

["match", "Match day", `
<ol>
  <li>On <b>Schedule</b>, tap the match and choose <b>Track this match</b>.</li>
  <li>The first time, choose how to keep score:
    <ul>
      <li><b>Every point:</b> tap <b>Point us</b> or <b>Point them</b> after each rally. Some taps score the rally for you, so don't also tap a point button for them: an <b>Ace</b>, <b>Kill</b> or <b>Solo block</b> scores for you; a serve <b>Out</b>, attack <b>Error</b>, block <b>Error</b> or set <b>Error</b> scores for them. (For a block <b>Assist</b>, tap Point us once.) You get a running score, set scores fill in by themselves, and side outs are counted.</li>
      <li><b>Final set scores only:</b> no point buttons; type each set's score when it ends.</li>
    </ul></li>
  <li>In a point-by-point match, answer <b>Who serves first?</b> at the start of each set.</li>
  <li><b>Court</b> (button in the dark match bar, or More → Court): tap a bench player, then a court position, for each of the starting six. See the next section.</li>
  <li><b>Serve tab:</b> the player at position 1 is picked for you when the court is set; otherwise tap the server. Then <b>Ace</b>, <b>In</b> or <b>Out</b>.</li>
  <li><b>Receive tab:</b> tap the passer (players on the court are listed first), then <b>0</b>–<b>3</b>.</li>
  <li><b>Attack tab:</b> choose <b>Attack</b>, <b>Block</b> or <b>Set</b> at the top, tap the player, then the result.</li>
  <li><b>Undo last</b> removes the last tap you made on this phone in this match, including a point it scored and a rotation it caused.</li>
  <li><b>Set ▾</b> finishes a set: check or type its score and start the next set, or end the match. Each new set starts with an empty court.</li>
</ol>
<p>The match bar stays at the top of Serve, Receive, Attack and Court, so you can switch between them during play. To fix scores later, open the match on Schedule and tap <b>Set scores</b>. An ended match can be reopened.</p>
<p><b>Two coaches at one match</b> can both track (for example one on Serve and Receive, one on Attack). Only one of you should run the Court and tap the point buttons.</p>`],

["court", "The Court tab", `
<ul>
  <li><b>Lineup:</b> tap a bench player, then a position. If someone was there she goes to the bench; that's a substitution (filling an empty spot isn't). Tap a player on the court to select her, then <b>Take off court</b>.</li>
  <li><b>Roles:</b> each position carries a role that moves with it: 1 Setter 1, 2 Pin 1, 3 Middle 1, 4 Opposite 1, 5 Pin 2, 6 Middle 2. Setter 1 shows as Opposite 2 in the front row, and Opposite 1 as Setter 2 in the back row. A libero always shows as Libero.</li>
  <li><b>Rotate</b> moves everyone clockwise (4→3, 3→2, 2→1, 1→6, 6→5, 5→4). In point-by-point matches the court rotates by itself when you win a rally on their serve (a side out). Turn that off with <b>Rotate on side outs</b>.</li>
  <li><b>Undo lineup change</b> steps back through lineup changes, restoring the substitution count too. It never removes recorded stats.</li>
  <li><b>Substitutions:</b> 15 per set, shown at the top. Changes involving the libero don't count. After 15, counted substitutions are blocked.</li>
  <li><b>Libero in the front row:</b> a red notice appears and Rotate is off until you bring someone in for her: just tap a bench player.</li>
  <li><b>Rotation count 3:</b> when a player set to 3 crosses between the back and front rows, the app asks whether to substitute. Tap a bench player, or <b>Keep anyway</b>.</li>
  <li><b>Libero for a Middle:</b> when a Middle reaches position 1 (after rotating, or after you lose the serve) and the libero is on the bench, the app offers to bring the libero in.</li>
</ul>`],

["stats", "Stats", `
<p>More → Stats shows each player for the season, one match, or one set. Switch views at the top:</p>
<ul>
  <li><b>Serve &amp; pass:</b> serves, aces, in, out, serve % (aces plus in, out of all serves), passes and average pass. Shaded: more than 3 serves and over half out, or more than 3 passes averaging under 1. Point-by-point matches also show the team's side-out %.</li>
  <li><b>Attack:</b> kills, errors, attempts, and hitting % = (kills − errors) ÷ attempts.</li>
  <li><b>Block &amp; set:</b> solo blocks, block assists, total blocks (solo + half of each assist), block errors, set assists and set errors.</li>
  <li><b>Playing time:</b> sets, rotations and rallies on the court for each player, and her share of all rallies. Players well below the team's middle player are shaded. This is your record if a parent asks about playing time; it's counted from the Court tab, so keep the lineup current during matches.</li>
</ul>
<p><b>Copy for email</b> copies the table you're looking at; paste it into an email. <b>Export to Excel</b> saves every recorded tap as a CSV file.</p>`],

["sync", "Syncing with Home Base and other coaches", `
<p>Every phone keeps its own copy of the data. Sync files move data between phones and the PC. Each record has its own ID, so merging never loses anything:</p>
<ul>
  <li>New records are added. A record changed more recently replaces the older copy. Anything else is left alone.</li>
  <li>Deleting a player or match sends that deletion along too, so it doesn't come back.</li>
  <li>Importing the same file twice changes nothing.</li>
</ul>
<p><b>Phone to PC (after each match or tournament):</b></p>
<ol>
  <li>More → Sync → <b>Export sync file</b>.</li>
  <li>Send it to yourself: Mail or Outlook, or <b>Save to Files</b> into OneDrive.</li>
  <li>In Home Base on the PC, import it (or save it into Home Base's <b>inbox</b> folder).</li>
</ol>
<p><b>PC to phones (to share the roster and schedule):</b></p>
<ol>
  <li>In Home Base, click <b>Download setup file</b> and email it to each coach.</li>
  <li>On the phone: save the attachment to Files, then More → Sync → <b>Import file</b>.</li>
</ol>
<p>Coaches can also swap sync files directly with each other the same way.</p>`],

["homebase", "Home Base on the PC", `
<ol>
  <li>Install Python 3 from python.org. On the first installer screen, tick <b>Add python.exe to PATH</b>.</li>
  <li>Put the <code>vb-home-base</code> folder somewhere permanent, such as Documents.</li>
  <li>Double-click <code>start-home-base.bat</code>. Leave the black window open; your browser opens Home Base at <code>http://localhost:8770</code>.</li>
  <li>The Dashboard imports files, downloads setup files, and lists recent imports. Reports show season stats (serve, pass, attack, block, set), playing time, match results and the schedule.</li>
</ol>
<p>The master database is <code>volleyball.db</code> in that folder: a normal SQLite file you can open with DB Browser for SQLite. Home Base keeps a copy of every imported file in <code>imports</code> and a daily backup of the database in <code>backups</code>.</p>`],

["data", "Keeping your data safe", `
<ul>
  <li>Export a sync file after every match. Once Home Base has it, it's backed up.</li>
  <li>Deleting the app's icon from the Home Screen can delete the data saved in it. Export first.</li>
  <li>More → Sync shows how many records are on this phone and when you last exported.</li>
</ul>`],

["trouble", "Troubleshooting", `
<ul>
  <li><b>The Serve tab picks the wrong server:</b> the court is out of step. Fix it on the Court tab (Rotate or Undo lineup change).</li>
  <li><b>No players show on Serve or Receive:</b> add players to this match's team on More → Team.</li>
  <li><b>"No match selected":</b> tap the match on Schedule, then <b>Track this match</b>.</li>
  <li><b>The roster or schedule disappeared:</b> the app was opened a different way (Safari instead of the Home Screen icon) or on another phone. Use the same icon, or import a setup file.</li>
  <li><b>The CSV is greyed out when importing:</b> it isn't saved as .csv. Save it from Excel as CSV.</li>
  <li><b>"This isn't a Team app sync file":</b> import only files exported from this app or Home Base.</li>
  <li><b>The screen dims during a drill:</b> Settings → Display &amp; Brightness → Auto-Lock → Never.</li>
</ul>`],

["next", "Coming next", `
<ul>
  <li><b>Phase 3:</b> Work rotation for officiating duties, Helpful links, more Home Base reports.</li>
</ul>`],
];

export function render(main) {
  main.innerHTML = `<section class="card guide"><h2>Guide</h2>
      <div class="toc">${SECTIONS.map(([id, t], i) => `<button type="button" class="item" data-to="${id}" style="padding:8px 4px">
        <span class="main-txt">${i + 1}. ${t}</span><span class="chev">›</span></button>`).join("")}</div></section>
    ${SECTIONS.map(([id, t, body], i) => `<section class="card guide" id="g-${id}"><h3>${i + 1}. ${t}</h3>${body}</section>`).join("")}`;
  for (const b of $$("[data-to]", main)) b.onclick = () => document.getElementById("g-" + b.dataset.to)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
