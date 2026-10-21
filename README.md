# SafeStride AI — AI-Powered Women's Safe Commute Companion
> **Plan smarter. Travel prepared. Stay connected.**

SafeStride AI is an explainable commute companion and safety intelligence platform designed to empower women traveling through unfamiliar, late-night, or transit corridors. It provides verified support facility discovery, deterministic route-readiness scoring, active in-journey check-in monitoring (Journey Guardian), and rapid simulated emergency escalation.

---

## 🌟 Key Pillars

1. **Explainable Route Readiness Intelligence**:
   - A deterministic, transparent 4-factor scoring model:
     $$\text{Score} = 0.30F + 0.25T + 0.25L + 0.20D$$
     - **$F$ (30%)**: 24/7 Support Facilities & Safe Havens (police stations, 24-hr staffed pharmacies, crisis centers).
     - **$T$ (25%)**: Public transit accessibility within pedestrian buffer.
     - **$L$ (25%)**: Street lighting data coverage and verified illumination corridors.
     - **$D$ (20%)**: Community safety data freshness and verified local notices.
   - Transparent missing-data policies that disclose unverified quadrants and penalize confidence rather than fabricating facts.
   - Mandatory disclaimer: *"Route readiness summarizes available public evidence and does not guarantee personal safety."*

2. **Journey Guardian Active Accompaniment**:
   - State machine: `IDLE` $\rightarrow$ `ACTIVE` $\rightarrow$ `CHECKIN_DUE` $\rightarrow$ `ALERT_PENDING` $\rightarrow$ `ALERT_SIMULATED` $\rightarrow$ `RESOLVED`.
   - Real-time countdown clock with periodic check-in checkpoints.
   - Synthesized Web Audio siren alarm and check-in confirmation chimes (zero external audio file dependencies).
   - Multi-stage emergency escalation with 10-second cancellation window and simulated SMS dispatch audit log.

3. **Community Safety Intelligence & Moderation**:
   - Crowdsourced local hazard observations (lighting outages, suspicious activities, infrastructure obstructions).
   - Strict `UNDER_REVIEW` quarantine for incoming reports so unreviewed allegations are never displayed as established facts.
   - Built-in moderator review interface to approve, flag, or reject reports.

4. **Multi-City Support**:
   - Pre-seeded with verified facilities and real coordinates across **San Francisco**, **London**, and **New York City**, plus live browser GPS geolocation.

5. **Server-Side Gemini 3.8 Flash AI Integration**:
   - Generates contextual route preparation checklists and checkpoint recommendations via `@google/genai`.
   - Built with deterministic, rules-based fallbacks so the application never breaks if the AI key is unavailable or throttled.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript (strict mode), Tailwind CSS v4, Lucide React, Motion.
- **Mapping & Spatial**: MapLibre GL JS + high-contrast vector canvas fallback with GeoJSON overlays.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Database Engine**:
  - **Embedded Persistent Engine**: High-performance local file persistence (`./data/safestride.json`) for zero-config demonstration and offline evaluation.
  - **MongoDB Atlas Integration**: Official `mongodb` driver connecting to your Atlas cluster when `MONGODB_URI` is provided.
- **AI**: `@google/genai` (model: `gemini-3.8-flash`) via server-side route `/api/ai/journey-advice`.

---

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 20+ (or Node 22+)
- npm 10+

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/your-username/safestride-ai.git
cd safestride-ai

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment
cp .env.example .env
# Set GEMINI_API_KEY and MONGODB_URI if you wish to use external Atlas / Gemini.
# If left unset, SafeStride seamlessly uses its embedded persistent engine and deterministic AI fallbacks.

# 4. Start full-stack development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 💻 Exact Windows Installation Instructions

1. **Install Node.js**:
   - Download the LTS installer from [nodejs.org](https://nodejs.org).
   - Run the installer and check the box to automatically install necessary build tools.
2. **Open Windows Terminal / PowerShell**:
   ```powershell
   cd C:\path\to\your\projects
   git clone https://github.com/your-username/safestride-ai.git
   cd safestride-ai
   ```
3. **Install Dependencies**:
   ```powershell
   npm install
   ```
4. **Run the Application**:
   ```powershell
   npm run dev
   ```
5. Open your web browser and navigate to `http://localhost:3000`.

---

## ☁️ MongoDB Atlas Configuration Guide

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster in your preferred region.
3. Under **Database Access**, create a database user (e.g. `safestride_admin`) with read/write permissions.
4. Under **Network Access**, add an IP access entry:
   - For hackathon/testing: `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** $\rightarrow$ **Drivers** $\rightarrow$ **Node.js**.
6. Copy the connection string and paste it into `.env`:
   ```env
   MONGODB_URI="mongodb+srv://safestride_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
   MONGODB_DB="safestride"
   ```
7. When started, SafeStride AI automatically detects `MONGODB_URI` and logs:
   `[SafeStride DB] Connected to external MongoDB Atlas successfully.`

---

## 🚢 Vercel Deployment Instructions

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `MONGODB_URI`: Your MongoDB Atlas connection URI.
   - `MONGODB_DB`: `safestride`
4. Set Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**.

---

## 🎬 7-Minute Hackathon Demonstration Script

1. **Introduction & Motivation (1 min)**:
   - Open Landing Page (`/`). Point to the tagline: *"Plan smarter. Travel prepared. Stay connected."*
   - Highlight that SafeStride AI was built specifically for women commuting through unfamiliar or late-night areas, focusing on transparent public evidence rather than false guarantees.
2. **Preset City & Corridor Discovery (1 min)**:
   - Use the top-bar city switcher to toggle between **San Francisco** (4th & King Caltrain $\rightarrow$ Mission District), **London** (Kings Cross $\rightarrow$ Shoreditch), and **New York City** (Grand Central $\rightarrow$ Lower East Side).
   - Show how the map updates with real 24/7 police stations, staffed pharmacies, and safe havens.
3. **Explainable Route Readiness (1.5 min)**:
   - Navigate to **Journey Planner** (`/planner`).
   - Showcase the deterministic score breakdown: 30% Support Facilities ($F$), 25% Transit Accessibility ($T$), 25% Lighting ($L$), and 20% Data Freshness ($D$).
   - Point to the missing-data disclosure alert showing confidence level.
   - Click **Generate Journey Advice** to display server-side Gemini 3.8 Flash route checklists.
4. **Journey Guardian Active Accompaniment & SOS (2 min)**:
   - Click **Start Monitored Journey**.
   - Show the live countdown clock in **Journey Guardian** (`/guardian`).
   - Click **I'm Safe · Check In Now** $\rightarrow$ hear the pleasant confirmation chime and see Checkpoint #1 recorded in the audit log.
   - Click **SOS Panic Button** $\rightarrow$ show the 10-second warning countdown $\rightarrow$ hear the synthesized alarm siren.
   - Show the **Simulated SMS Dispatch Audit Trail** displaying mock SMS alerts dispatched to Elena Rostova and Priya Sharma with coordinates.
   - Click **Resolve Alert** to return the state machine to normal.
5. **Community Intelligence & Moderator Review (1 min)**:
   - Open **Community Reports** (`/incidents`).
   - Submit a new observation (e.g. "Flickering streetlights on 10th St").
   - Notice the status is immediately marked **UNDER_REVIEW**.
   - As moderator Maya Chen, click **Approve Advisory** to promote it to the active commuter feed.
6. **Closing (30 sec)**:
   - Navigate to **History & Analytics** (`/history`) to display the complete journey audit trail and commute stats.

---

## 📊 Feature Status Report

| Feature Area | Implementation Status | Notes |
| :--- | :--- | :--- |
| **Deterministic Scoring** | **Fully Implemented** | Pure TypeScript module evaluated by automated tests ($0.30F + 0.25T + 0.25L + 0.20D$). |
| **Missing-Data Transparency** | **Fully Implemented** | Explicitly displays missing layers and penalizes confidence score. |
| **Dual-Engine MongoDB** | **Fully Implemented** | Embedded persistent engine active by default; seamlessly switches to live Atlas when URI provided. |
| **Interactive Map** | **Fully Implemented** | MapLibre GL with dark vector canvas fallback for 100% rendering reliability. |
| **Journey Guardian State Machine** | **Fully Implemented** | Full state cycle with countdown timer and overdue triggers. |
| **Audio Synthesizer** | **Fully Implemented** | Web Audio API generated siren and chimes without external audio assets. |
| **SOS Escalation & SMS** | **Simulated & Labelled** | Generates real database records and audit trails; visibly labelled as simulated prototype. |
| **Server-Side Gemini AI** | **Fully Implemented** | `@google/genai` (model: `gemini-3.8-flash`) with structured schema & deterministic fallback. |
| **Community Reports & Moderation** | **Fully Implemented** | Full submission, quarantine, and moderator approval workflow. |
| **Automated Unit Tests** | **Executed & Verified** | 9/9 tests passed via `npx tsx tests/scoring.test.ts`. |
