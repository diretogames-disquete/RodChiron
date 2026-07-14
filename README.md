# RodChiron — 1SG Command Deck

**Standalone, single-file dashboards** that help an Army First Sergeant (1SG) —
or any leader of people — track the things that actually eat their day:
personnel, readiness, accountability, suspenses, counseling, and Soldier care.

There is no server, no install, and no build step. Each edition is one HTML
file. Double-click it (or open it in any modern browser) and it runs. All data
is stored **locally in your browser** — nothing is ever uploaded.

## Two editions

| File | For | Adds |
|---|---|---|
| **`index.html`** | **Company-level 1SG** — one unit | Dashboard, roster, readiness, accountability, suspenses, counseling, settings. |
| **`group.html`** | **Group / battalion 1SG** — multiple subordinate units | Everything in the company deck **plus** multi-unit roll-up, a **Care & Cases** module for life/personal issues, a referral **Resources** directory, editable case/action types, per-unit filtering, and one-click import of a Company deck's roster. |

Start with whichever matches your echelon. The two decks keep their data
separately; `group.html` can pull a roster in from `index.html` on the same
browser (Settings → *Import from Company deck*). Each file links to the other in
the sidebar.

---

## Quick start

1. Open `index.html` (company) or `group.html` (group) in a browser
   (Chrome, Edge, Firefox, Safari).
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

## Group edition (`group.html`) — what's extra

Built for a **Group / battalion 1SG** who oversees several subordinate units and
carries the well-being fight for the whole formation. It contains everything in
the company deck, plus:

- **Multi-unit roll-up.** Define your subordinate units (companies / detachments
  / teams). Every Soldier belongs to a unit; the dashboard shows a per-unit
  comparison of strength, present %, readiness-red, and high-risk counts, and the
  roster filters by unit.
- **Care & Cases — life & personal issues.** A full case-management module for
  the things a 1SG actually chases down: **financial, family/marital, behavioral
  health, legal, housing, EFMP, bereavement, substance/ASAP, high-risk/safety,
  medical, sponsorship, pay/DTS**, and anything you add. Each case has a
  **severity**, a **status workflow**, a **POC**, a **referred resource**, a
  **next-follow-up date**, and an **append-only notes timeline**. Overdue
  follow-ups and High/Critical cases flag on the dashboard and raise the
  sidebar badge.
- **Confidential handling.** Mark any case **Confidential** to blur its summary
  and notes (and hide the type in alerts) until you explicitly choose *Reveal
  sensitive*. Handle in accordance with your privacy / medical-information rules.
- **High-Risk view.** Each Soldier gets a derived risk level from their open
  cases; filter the roster to just High-Risk, and see a dedicated High-Risk tab
  in Care & Cases for your risk-reduction (R2) roll-ups.
- **Resources directory.** An editable list of referral agencies (ACS, MFLC,
  Chaplain, Behavioral Health, JAG, Financial Readiness, Military OneSource,
  ASAP, Red Cross, EFMP, 988 Lifeline …) with contacts, grouped by category and
  linkable from any case. Fill in your installation's local numbers.
- **Editable actions everywhere.** Case types (name/color/high-risk flag),
  severities (with weights), the case-status workflow, counseling/action types,
  duty statuses, requirements, ranks, and units are all user-editable in
  Settings.
- **Import from the Company deck.** One click pulls a `index.html` roster (on the
  same browser) into a new unit, so a Group 1SG can absorb a subordinate's data.
- **Care follow-up warning window** and a separate steel/slate theme so the two
  decks are visually distinct.

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
- **Care cases are sensitive by nature.** Behavioral-health, ASAP, EFMP, and
  legal matters carry privacy protections. Use the **Confidential** flag, keep
  entries to what you need to manage the case, and follow your unit's rules for
  protected health and personal information.

---

## Technical notes

- Single self-contained `index.html` — HTML, CSS, and vanilla JavaScript, no
  dependencies, works fully offline.
- Status colors use a colorblind-safe (CVD-validated) palette and pair color with
  text labels, so meaning is never carried by color alone.
- Responsive down to phone width; includes a print stylesheet for roll-ups.
