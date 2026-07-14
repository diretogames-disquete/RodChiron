# RodChiron — 1SG Personnel Command Deck

A **standalone, single-file dashboard** that helps an Army First Sergeant (1SG) —
or any small-unit leader — track the things that actually eat a 1SG's day:
personnel, readiness, accountability, suspenses, and counseling.

There is no server, no install, and no build step. Everything lives in
`index.html`. Double-click it (or open it in any modern browser) and it runs.
All data is stored **locally in your browser** — nothing is ever uploaded.

---

## Quick start

1. Open `index.html` in a browser (Chrome, Edge, Firefox, Safari).
2. Click **Settings → Load demo data** to explore with a sample platoon, **or**
   click **＋ Add Soldier** to start your own roster.
3. Set your unit identity and tune the tracked requirements in **Settings**.
4. **Export a backup** regularly (Settings → Backup & restore).

To move your data to another device, use **Export backup (.json)** on one and
**Import backup** on the other.

---

## What it tracks

| Section | What it's for |
|---|---|
| **Dashboard** | At-a-glance KPIs (assigned strength, present %, red readiness, overdue suspenses, upcoming expirations), readiness/accountability charts, and a prioritized **Command Alerts** feed. |
| **Roster** | Full personnel CRUD — rank, MOS, element/squad, duty status, contact, notes. Search, filter, and sort. |
| **Readiness** | A Soldier × requirement matrix (ACFT, Weapons Qual, PHA, Dental, Vision, Hearing, HIV, SRP, …). Each cell auto-colors **green / amber / red** from the last-completed date and the requirement's cycle. Click any cell to update it. |
| **Accountability** | A live duty-status board (PDY, Leave, Pass, TDY, School, Appointment, Detail, Sick Call, AWOL). Change a Soldier's status in one click; leave/TDY prompt for a return date. |
| **Suspenses** | Taskers with category, priority (Routine/Priority/Immediate), assignee, due date, and status. Overdue items flag automatically. |
| **Counseling & Actions** | A running log of DA 4856 counselings, awards, promotions, NCOERs, reprimands, and corrective training — per Soldier. |

## Settings — built for "maximum optimization and specifications"

Nearly everything is configurable so the dashboard matches *your* unit, not a
generic template:

- **Unit identity** — company, UIC, commander, 1SG, motto.
- **Readiness requirements** — add/remove/rename any requirement; set each one's
  **cycle length** (days valid) and **amber window** (days before due it warns).
  Deactivate ones you don't track.
- **Duty statuses** — add/rename/recolor statuses and choose which ones count as
  "present for duty."
- **Ranks, elements/platoons, squads** — edit the dropdown lists.
- **Suspense warning window** — how many days out a tasker turns amber.
- **Theme** — Light / Dark / Auto (follows the OS).
- **Backup & restore** — JSON export/import, roster CSV export, load demo data,
  and a full data wipe.

---

## Data, privacy & OPSEC

- **Local only.** Data is saved with your browser's `localStorage` on the device
  you're using. It is never transmitted anywhere.
- **Back it up.** Clearing your browser's site data (or using a different
  browser/device) will make the data inaccessible. Use **Export backup** to keep
  a copy.
- **Mind PII/OPSEC.** This is a personal productivity aid, not an authorized
  system of record. Do **not** enter classified information or full PII (SSNs,
  full DoD IDs). The Soldier form intentionally captures only the **last 4** of a
  DoD ID.

---

## Technical notes

- Single self-contained `index.html` — HTML, CSS, and vanilla JavaScript, no
  dependencies, works fully offline.
- Status colors use a colorblind-safe (CVD-validated) palette and pair color with
  text labels, so meaning is never carried by color alone.
- Responsive down to phone width; includes a print stylesheet for roll-ups.
