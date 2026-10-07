# CampusPulse: Judge Demo Checklist and 2-Minute Presentation Guide

A step-by-step operational guide for presenting CampusPulse to hackathon judges in two minutes.

---

## 1. Browser Tabs Setup

Open the following browser tabs side-by-side or in tabs before the presentation starts:

| Tab | URL | Role | Purpose |
|---|---|---|---|
| **Tab 1 (Primary)** | `http://localhost:3000/demo` | Presenter / Admin | **Guided 2-Minute Walkthrough**: Main presentation deck with speaker cues and 1-click action triggers. |
| **Tab 2** | `http://localhost:3000/admin` | Dr. Priya Menon (Admin) | **Command Centre**: Spatial digital twin, telemetry pipeline, what-if sandbox, and privacy panel. |
| **Tab 3** | `http://localhost:3000/` | Abhay (Student) | **Student Dashboard**: Live occupancy cards, dynamic recommendation widget, and 10-minute hold pass. |

*Tip: You can use split-screen mode (Tab 1 on the left, Tab 2/3 on the right) to show the student app reacting in real time to admin actions.*

---

## 2. Account Personas &amp; Roles

CampusPulse includes one-click demo persona switchers on the login and auth gates.

### Student Persona
- **Name**: Abhay
- **Role**: `student`
- **Email**: `abhay.student@campus.edu`
- **ID**: STU-2024-8841
- **Focus**: Finding open study spots, checking wait queues, setting crowd drop alerts, and reserving 10-minute seat holds.

### Administrator Persona
- **Name**: Dr. Priya Menon
- **Role**: `admin`
- **Email**: `priya.menon@campus.edu`
- **Title**: Director of Campus Operations &amp; Facilities
- **Focus**: University-wide occupancy distribution, crowd pressure corridors, automated rule insights, and what-if capacity deployment.

---

## 3. Step-by-Step Scenario Presentation (2-Minute Pitch)

Use the built-in timer at `/demo` to track your 120 seconds.

### Step 1: See the Campus Now (0:00 - 0:25)
- **Speaker Cue**: 
  - "Judges, campus spaces are either overcrowded or underused because students and administrators lack real-time visibility."
  - "CampusPulse explores this with a privacy-first spatial twin prototype using aggregate occupancy data."
  - "This walkthrough uses simulated occupancy across six spaces; the prototype does not collect individual movement data."
- **Presenter Action**: Click **"Verify Live Telemetry Baseline"** on Step 1.
- **Visual Result to Point Out**:
  - Balanced status badges across spaces.
  - Simulated occupancy heartbeat updating at the top.
  - Total campus occupancy at ~58% load.

### Step 2: Create a Real Operational Problem (0:25 - 0:50)
- **Speaker Cue**:
  - "Now, let's observe what happens during peak hours: I will trigger a sudden Lunch Rush surge."
  - "I will apply a simulated lunch rush at the Main Canteen."
  - "Occupancy spikes past 85%, wait lines reach 14 minutes, and corridor transit vectors turn amber."
- **Presenter Action**: Click **"Simulate Lunch Rush Spike"** on Step 2.
- **Visual Result to Point Out**:
  - Main Canteen badge turns red ("Crowded" status).
  - Estimated queue wait jumps to 14 minutes.
  - High Inflow corridor arrow thickens between Academic Block and Main Canteen.

### Step 3: Recommend a Better Student Choice (0:50 - 1:15)
- **Speaker Cue**:
  - "Instead of letting students walk into a 14-minute queue, CampusPulse intervenes proactively."
  - "The recommendation view compares simulated occupancy with noise preferences, walking distance, and capacity."
  - "The top student recommendation dynamically switches to Academic Cafe: 0-minute wait, 48% comfortable seating, and only a 4-minute walk."
- **Presenter Action**: Click **"Calculate Dynamic Alternative"** on Step 3.
- **Visual Result to Point Out**:
  - Side-by-side comparison card: Overcrowded Bottleneck (Rank #6) vs Recommended Choice (Rank #1, Score: 94).
  - Clear trade-off rationale displayed to the student without algorithmic mystery.

### Step 4: Close the Feedback Loop (1:15 - 1:40)
- **Speaker Cue**:
  - "CampusPulse closes the loop between facility operations and student behavior."
  - "The demo shows a crowd-drop alert for the library and a ten-minute desk hold."
  - "A live campus deployment would need a verified occupancy feed and a shared reservation database."
- **Presenter Action**: Click **"Execute Student Feedback Loop"** on Step 4.
- **Visual Result to Point Out**:
  - Live in-app alert banner: "Seat Free in Central Library (68% load)".
  - Active 10-minute hold pass ticket generated with digital pass identifier `PASS-8841`.
  - Library capacity adjusts cleanly.

### Step 5: Help Administrators Act Early (1:40 - 2:00)
- **Speaker Cue**:
  - "Finally, we empower administrators to act before bottlenecks become safety hazards."
  - "In the Command Centre, the What-If Capacity Planner simulates opening Seminar Hall A as an overflow study space."
  - "The planner simulates opening overflow capacity and estimates the effect on crowded zones and available seats."
- **Presenter Action**: Click **"Deploy Seminar Hall A Capacity Policy"** on Step 5.
- **Visual Result to Point Out**:
  - Before/after metric comparison: Crowded zones cut from 2 to 1; Available seats increased by +90.
  - Rebalanced spatial distribution table.
  - In-app student announcement banner confirmed.

---

## 4. Fallback Plan &amp; Resilience

CampusPulse has an offline-friendly demo mode for live judging:

| Component | Primary Production Mode | Demo / Offline Fallback Mode |
|---|---|---|
| **Database & Auth** | Optional Supabase Auth and PostgreSQL configuration | Preloaded demo personas; demo reservations, alerts, and preferences use browser local storage. |
| **Occupancy** | Requires a verified campus data source for deployment | Sample values and scenario changes are simulated for the walkthrough. |
| **Demo reset** | Returns occupancy simulation to baseline | Use the reset control on `/demo` or `/admin` before the walkthrough. |

*If you need to reset all simulated metrics at any time during the presentation, simply click the **"Reset Presentation"** button on `/demo` or `/admin`.*

---

## 5. Key Talking Points for Judges

1. **Privacy-First Direction**:
   - The prototype displays aggregate space values and does not use student movement histories to rank spaces.
   - A real sensor deployment would need verified data sources, institution approval, and a privacy review.

2. **Connected Student and Admin Flows**:
   - The walkthrough connects student recommendations and seat holds with an admin occupancy scenario and a what-if capacity plan.

3. **Deterministic and Transparent Rules**:
   - Operational insights are based on clear, deterministic capacity thresholds and queue rates, not black-box predictions.
   - Administrators see the exact signal, rationale, and simulation estimate before deploying any policy.

4. **Interface and Implementation**:
   - The interface uses a consistent navy, slate, cyan, emerald, and amber palette.
   - Built with Next.js App Router, Tailwind CSS tokens, and Framer Motion transitions.
