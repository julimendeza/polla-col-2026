# ⚽ Polla Mundialista 2026

A full-featured FIFA World Cup 2026 sweepstake web app for a group of friends. Built with vanilla React (no build step), hosted on GitHub Pages, with Firebase Realtime Database as the backend.

**Live site:** https://julimendeza.github.io/polla-col-2026/

---

## Features

- **Group stage predictions** — all 72 matches organised by matchday, with live standings and FIFA tiebreaker rules
- **Knockout predictions** — scores for all 32 KO matches (R32 → R16 → QF → SF → Final + 3rd place)
- **Auto bracket resolution** — Round of 32 bracket auto-calculated from group predictions using official FIFA 2026 fixture rules and Annex C best-third placement algorithm
- **Bracket visualisation** — mirrored bracket view showing each participant's predicted path to the final
- **Live leaderboard** — points update as the admin enters real results
- **Bilingual** — full English / Spanish support, including T&C PDF
- **Access control** — Off / Simple PIN / Robust PIN (pre-linked identity) — switchable from admin panel
- **Registration deadline** — configurable cutoff date; countdown banner and prediction lock after deadline
- **Terms & Conditions PDF** — auto-generated in the active language with current settings
- **Firebase backend** — all data synced in real time across all users
- **Admin panel** — results entry, participant management, email notifications (EmailJS), data export/import, backup/restore, Firebase sync
- **Mobile friendly** — responsive layout, iOS zoom prevention, touch-optimised bracket scroll

---

## Tournament Structure

- 12 groups × 4 teams = 48 teams, 72 group matches
- Best 8 third-placed teams qualify alongside the top 2 from each group
- Round of 32 (16 matches) → Round of 16 → Quarter-Finals → Semi-Finals → Final + 3rd place match
- Total: 104 matches

---

## Scoring

| Category | Points |
|---|---|
| Correct result (W/D/L) | 3 |
| Correct goals Team A | 1 |
| Correct goals Team B | 1 |
| Correct goal difference | 2 |
| **Max per group match** | **7** |
| Round of 32 (per team) | 1 |
| Round of 16 (per team) | 2 |
| Quarter-Finals (per team) | 4 |
| Semi-Finals (per team) | 6 |
| 3rd Place match (per team) | 8 |
| 3rd Place winner | 15 |
| Finalists (per team) | 10 |
| World Cup Champion | 20 |

**Tiebreaker order:** Champion → Runner-up → 3rd place winner → Points in Final+3rd → Points in SF → shared prize

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 (CDN), htm 3.1.1 (no Babel/build step) |
| Styling | Vanilla CSS, Bebas Neue + DM Sans (Google Fonts) |
| Backend | Firebase Realtime Database |
| Hosting | GitHub Pages |
| PDF | jsPDF 2.5.1 |
| Email | EmailJS (optional) |
| Flags | flagcdn.com |

No npm, no webpack, no build process — just static files.

---

## Project Structure

```
polla-col-2026/
├── index.html              # HTML shell + script load order
├── css/
│   └── styles.css          # All styles including responsive rules
└── js/
    ├── setup.js            # React hooks, htm, Firebase db, PIN helpers
    ├── data.js             # Groups, teams, fixtures, defaults (DEF), Claude entry
    ├── i18n.js             # EN + ES translations
    ├── logic.js            # Standings, KO cascade, scoring, tiebreaker
    ├── helpers.js          # PDF generator, admin email notification, T&C PDF
    ├── components.js       # Shared UI components + bracket visualisation
    ├── nav.js              # Navigation bar
    ├── view-home.js        # Home page
    ├── view-predict.js     # Prediction form (group + KO stages)
    ├── view-leaderboard.js # Leaderboard
    ├── view-admin.js       # Admin panel (results, participants, email, data, access, settings)
    └── app.js              # Root App component + Firebase wiring
```

---

## Setup & Deployment

### 1. Fork / clone the repo

```bash
git clone https://github.com/julimendeza/polla-col-2026.git
```

### 2. Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (already created: `polla-col-2026`)
3. Build → Realtime Database → Create database → **Start in test mode**
4. Copy the database URL (e.g. `https://polla-col-2026-default-rtdb.firebaseio.com`)
5. Verify it is set in `js/data.js` under `DEF.firebase`

### 3. Deploy to GitHub Pages

Push to the `main` branch. In the repo Settings → Pages, set source to `main` branch / root.

### 4. First-time admin setup

1. Open the site → **Admin** → enter password (`PuraFoda888!`)
2. Go to **Data** tab → click **Push all data to Firebase**
3. Confirm the green **Firebase** dot appears in the admin header

---

## Admin Guide

### Changing settings
Admin → Settings: entry fee, currency, admin password, Firebase URL, registration deadline, scoring points.

### Entering results
Admin → Results: enter group match scores (standings auto-calculate) and knockout advancing teams round by round.

### Managing participants
Admin → Participants: view all entries ranked by current score, delete participants.

### Access control (PIN)
Admin → Access:
- **Off** — open registration (default)
- **Simple** — participant enters a PIN you've issued, then fills their own name/email
- **Robust** — PIN is pre-linked to a name/email; details are pre-filled and locked

Generate PINs in the Access tab and share them with participants after they pay.

### Data backup
Admin → Data: download a JSON backup before any risky change, restore from backup, or push all local data to Firebase.

### Email notifications
Admin → Email: configure EmailJS (free tier) to send invitation and results update emails to all participants.

---

## Customisation

| What | Where |
|---|---|
| Groups & teams | `js/data.js` → `TBG` |
| Entry fee & currency | Admin → Settings (or `js/data.js` → `DEF`) |
| Bank details | `js/helpers.js` → `generateTCPDF()` |
| Scoring points | Admin → Settings |
| Registration deadline | Admin → Settings |
| Language default | `js/app.js` → `useState("es")` |
| Admin password | Admin → Settings |

---

## License

Personal project — not licensed for redistribution. All FIFA World Cup 2026 team names and tournament data are used for personal entertainment purposes only.
