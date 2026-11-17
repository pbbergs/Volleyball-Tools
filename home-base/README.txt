VOLLEYBALL HOME BASE
====================
Home Base keeps the club's master database (volleyball.db) on this PC. Coaches track matches
in the Team app on their phones, export a sync file, and Home Base merges it in. Home Base can
also make a setup file (teams, players, rosters, schedule, links) for the phones.

ONE-TIME SETUP
1. Install Python 3 from https://www.python.org/downloads/ (version 3.7 or newer).
   On the first installer screen, tick "Add python.exe to PATH".
2. Put this whole vb-home-base folder somewhere permanent, for example Documents\vb-home-base.
   If you use OneDrive, a folder inside OneDrive is fine.

EVERY TIME
1. Double-click start-home-base.bat. A black window opens; leave it open.
2. Your browser opens http://localhost:8770 (if not, type that address yourself).
3. To stop Home Base, close the black window.

IMPORT DATA FROM A PHONE
- On the phone: Team app > More > Sync > Export sync file, and send it to yourself.
- On the PC: Dashboard > choose the file > Import.
  Or save the file into the "inbox" folder: it is imported the next time Home Base starts,
  or when you click "Import inbox folder".
- Newer changes win. Importing the same file twice changes nothing. Nothing is ever deleted
  because a file doesn't mention it.

SEND DATA TO THE PHONES
- Dashboard > Download setup file. Send it to each coach.
- On the phone: Team app > More > Sync > Import file.

UPDATING HOME BASE
- The Dashboard checks for a newer Home Base each time you open it. When one is available,
  click "Update now". It backs up the database (backups\volleyball-before-vX.Y-....db) and the
  current program (backups\home_base-vX.Y.py), installs the new version and restarts itself.
- If it ever can't restart by itself, close the black window and double-click start-home-base.bat.
- Only the program comes from the web site. Your data never leaves this PC.

ADD A COACH
- The "Add a coach" tab shows a QR code that opens the Team app on a new coach's phone, the
  install steps (print it as a handout), and the setup file to send them by email or text.
- The setup file has players' names and ages: never post it anywhere public, including GitHub.

CLUB LOGO
- Dashboard > Club logo: choose a PNG or JPG and click "Use this logo". It goes to the phones
  in the next setup file and shows in the Team app's header.
- "Download app icon" makes icon.png (iPhone) plus icon-192.png and icon-512.png (Android): upload all three into the team folder
  on GitHub, then re-add the app to each Home Screen.

FILES IN THIS FOLDER
  home_base.py          the program
  start-home-base.bat   starts it
  volleyball.db         the master SQLite database (created on first start)
  inbox\                drop sync files here to import them
  imports\              a copy of every file that was imported
  backups\              one copy of the database per day, plus copies made before each update
  publish\              your tools for publishing new versions to the web site (see PUBLISH-README.txt)

OPENING THE DATABASE YOURSELF
volleyball.db is a normal SQLite file. Open it with "DB Browser for SQLite" (free) or any SQLite
tool. Ready-made views: v_schedule, v_match_results, v_serves, v_receives, v_attacks, v_blocks,
v_assists, v_points, v_player_season, v_playing_time, v_side_outs, v_work_matrix, v_links. Close Home Base before editing the file by hand.

TROUBLESHOOTING
- "python is not recognized": reinstall Python with "Add python.exe to PATH" ticked.
- "Port 8770 is already in use": Home Base is already running (maybe an old window). Close every
  Home Base window, or end python.exe in Task Manager, then start it again.
- An import says "This isn't a Team app sync file": export again from the Team app's Sync page.
