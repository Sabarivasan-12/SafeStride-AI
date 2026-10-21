# SafeStride AI — AI-Powered Women's Safe Commute Companion

SafeStride AI is an explainable commute safety platform designed to empower women traveling through unfamiliar or evening transit routes with verified support facility discovery, deterministic route-readiness scoring, automated check-in monitoring (Journey Guardian), and rapid simulated emergency escalation.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the planning interview and serve as governing specifications for the implementation:

- **Confirmed Decision 1 (Demo Presets & Geographies)**: Multi-city selector with rich pre-seeded real support facilities and incident datasets for **San Francisco Bay Area**, **London Central/East**, and **New York City**, plus browser geolocation support.
- **Confirmed Decision 2 (Persistence & Database Architecture)**: Full Express API backend featuring a persistent embedded MongoDB-compatible store initialized immediately for out-of-the-box demo execution, coupled with live MongoDB Atlas connection support when `MONGODB_URI` is provided.
- **Confirmed Decision 3 (Emergency Escalation & Guardian Experience)**: Full-featured Journey Guardian with an active timeline, countdown timer, overdue check-in simulation, multi-stage SOS escalation with audible siren alarm, simulated SMS broadcast audit trail, and emergency contact modals.

---

### 1. Overview & Core Concept

- **What It Does**: SafeStride AI provides women commuters with a complete pre-trip, in-trip, and emergency preparedness system. Commuters can evaluate routes against four transparent evidence factors (Support Facilities, Transit Access, Lighting Infrastructure, and Fresh Community Data), launch active monitored journeys with regular check-in deadlines, explore verified safe havens (24/7 pharmacies, staffed transit hubs, emergency stations), and trigger simulated SOS protocols if help is needed.
- **Target Audience / Persona**: Women commuting in unfamiliar metropolitan areas, late-night workers, students traveling across urban campuses, and their trusted emergency contacts.
- **Key Value & Responsible Safety Framing**: 
  - Transparent route readiness: The app provides clear evidence factors, explicitly discloses missing information, and never claims to guarantee absolute personal safety.
  - Guardian State Machine: Clear check-in timeline that keeps users alert and provides an auditable history of check-in events.
  - Zero-slop, rapid-action user experience: Intuitive navigation, high-contrast night aesthetics, and zero dead clicks.

---

### 2. User Experience & Visual Design

#### Key User Flows & Application Views

1. **Landing Page (`/`)**:
   - Brand hero with high-contrast typography, core value proposition, and immediate CTA to Launch Journey Planner or Open Demo Dashboard.
   - Interactive 3-step mechanism showcase: *1. Plan & Compare Routes* $\rightarrow$ *2. Journey Guardian Active Check-ins* $\rightarrow$ *3. Community Intelligence*.
   - Prominent Responsible-Use Disclosure banner ("Route readiness summarizes available public evidence and does not guarantee personal safety").
   - Quick Demo Switcher (Guest User, City Preset Switcher).

2. **Command Dashboard (`/dashboard`)**:
   - High-level commute readiness overview, active journey banner (with instant resume action if a journey is in progress).
   - Quick route-search launcher with origin/destination input.
   - Mini Map widget showcasing nearby support facilities and recent verified reports.
   - Trusted Contacts widget showing active alert consent status.
   - Recent Journey History & Safety Log.

3. **Journey Planner (`/planner`)**:
   - Origin and destination search with geocoding and presets (e.g. SF Caltrain $\rightarrow$ Mission District, London Kings Cross $\rightarrow$ Shoreditch, NYC Grand Central $\rightarrow$ Lower East Side).
   - Interactive Map with route polyline rendering and support facility pins within 400m buffer zones.
   - Deterministic Route Readiness Card:
     - Composite Score (0–100) computed via `0.30F + 0.25T + 0.25L + 0.20D`.
     - Factor breakdown with evidence indicators (Facilities, Transit, Lighting, Community Freshness).
     - Missing data alerts (e.g., "Street lighting dataset provisional").
   - AI Journey Preparation Panel (powered by Gemini via server-side API with deterministic fallback): Packing checklist, safety recommendations, and route narrative.
   - "Start Monitored Journey" action to transition directly into the Guardian state machine.

4. **Journey Guardian (`/guardian`)**:
   - Dedicated active commute monitor with high-visibility countdown clock until next required check-in (configurable: 5 min, 10 min, 15 min, or custom demo 30-sec fast interval).
   - Active journey timeline: Departure time, checkpoints, check-ins logged, and battery/network status reminders.
   - "I Have Arrived / Check In Now" primary action with smooth confirmation micro-interaction.
   - Overdue warning trigger: transitions to `ALERT_PENDING` (30s cancellation window) $\rightarrow$ `ALERT_SIMULATED`.
   - SOS Panic Button with multi-stage confirmation, audible synthesized siren sound, simulated SMS dispatch log, and emergency contact details.
   - Clear disclaimer that browser timers require the tab to stay open.

5. **Support Facilities Directory (`/facilities`)**:
   - Dual Map & Filterable List view.
   - Categories: Police Stations, 24/7 Staffed Pharmacies, Transit Stations, Safe Havens / Designated Support Centers.
   - Verification badges: Source attribution (e.g. City Open Data, Transit Authority), verified timestamp, and contact telephone links (`tel:`).
   - Distance calculation from user's current city center or geolocated position.

6. **Community Safety Intelligence & Reports (`/incidents`)**:
   - Anonymous incident submission form: Category (Lighting Outage, Suspicious Activity, Blocked Walkway, Harassment Report), approximate location, timestamp, and description.
   - Gemini server-side AI categorization assistant to recommend incident severity and moderation tags.
   - Community Incident Feed with strict review status indicators: `UNDER_REVIEW` (caution banner), `APPROVED` (verified community notice), or `REJECTED`.
   - Moderator Review Switch: Authorized toggle allowing demo users to approve, flag, or reject incoming reports.

7. **Trusted Contacts Manager (`/contacts`)**:
   - Contact list: Name, relationship, phone number, and sharing preferences.
   - Consent status manager with simulated verification workflow.
   - Simulated Notification Test: Sends a mock SMS dispatch event to test the contact link.

8. **Emergency Center (`/emergency`)**:
   - One-touch emergency dials (911 / 999 / 112 with automatic country detection based on city preset).
   - Local women's helpline and crisis hotline directories with direct telephone anchors.
   - Active Journey SOS broadcast summary and audit trail of simulated emergency dispatches.

9. **History & Analytics (`/history`)**:
   - Complete log of past commutes with timestamps, check-in completion rate, route readiness scores, and simulated alert events.
   - Analytics charts (Recharts): Commutes by time-of-day, check-in reliability percentage, and readiness distribution.

10. **Settings & Privacy (`/settings`)**:
    - User Profile, privacy mode (obfuscate exact start/end locations to 100m grid), data wipe / account reset option, and notification preferences.

#### Visual Identity & Design System

- **Aesthetic Direction**: High-security, calming, purposeful midnight dashboard. Zero-slop discipline, zero pill-enclosures for metadata, single-elevation depth.
- **Color Palette**:
  - Dominant Canvas (60%): Deep Midnight Navy (`#090D16` / `#0f172a`), Structural surfaces (`#131B2E` / `#1e293b`) with hairline borders (`rgba(255,255,255,0.08)`).
  - Secondary/Text (30%): Clean white (`#F8FAFC`), cool muted slate (`#94A3B8`), subtle dividers (`#1E293B`).
  - Accent Budget (10%): Phosphor Teal (`#14B8A6`) and Mint (`#10B981`) for safety/affirmation; Muted Amber (`#F59E0B`) for caution/deadlines; Crimson Red (`#EF4444`) strictly reserved for SOS and alert states.
- **Typography**:
  - Display & Headings: `Plus Jakarta Sans` / `Outfit` (clean neo-grotesque with distinct letterforms).
  - Body & Form Controls: `DM Sans` / `Public Sans` with 1.6 line-height.
  - Data, Timestamps, and Coordinates: Strictly `font-mono tabular-nums` (`IBM Plex Mono` / `JetBrains Mono`).
- **Interactive Feedback**:
  - Countdown clock with radial SVG progress ring.
  - Audible siren test via browser Web Audio API oscillator (no broken audio asset dependencies).
  - Toast notification system with custom icons for check-ins, simulated SMS broadcasts, and moderation updates.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Deterministic Route Readiness Engine (`0.30F + 0.25T + 0.25L + 0.20D`)
- **Approach**: Dedicated TypeScript scoring module independent of UI and network calls. Evaluates route bounding boxes against support facility density ($F$), transit stops ($T$), street lighting coverage ($L$), and recent incident reports ($D$).
- **Transparency & Missing Data**: If lighting data is unavailable for a quadrant, the factor is flagged as "Provisional / Missing Dataset" and the confidence index is reduced from 100% to 75%, rather than fabricating data.
- **Disclaimer**: Mandatory display of the safety disclaimer on all assessment panels.

#### Decision 2: Dual-Mode MongoDB Storage Architecture
- **Approach**: Full Express backend with an integrated MongoDB adapter. Uses a persistent embedded database store on disk (`./data/safestride.db`) that guarantees instantaneous demo execution with zero setup, while natively accepting an external `MONGODB_URI` environment variable if MongoDB Atlas credentials are provided.
- **Why**: Eliminates cold-start failures in hackathon evaluations and dev containers while providing identical query semantics (`collection('trips').find()`, `insertOne()`, `updateOne()`, `aggregate()`).

#### Decision 3: Server-Side Gemini API Integration with Fallbacks
- **Approach**: Dedicated Express route `/api/ai/journey-advice` utilizing `@google/genai` (model `gemini-3.8-flash`) with strict structured JSON output and Zod validation.
- **Resilience**: If `GEMINI_API_KEY` is unset or rate-limited, the endpoint automatically returns an intelligent, deterministic, rules-based journey advisory so the UI never crashes or stalls.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SafeStride AI Client                            │
│  React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide + MapLibre  │
├───────────────┬─────────────────┬───────────────────┬──────────────────┤
│ Journey Map   │ Guardian State  │ Facilities &      │ SOS & Emergency  │
│ & Polyline    │ Machine Timer   │ Community Reports │ Audio & SMS Log  │
└───────┬───────┴────────┬────────┴─────────┬─────────┴────────┬─────────┘
        │                │                  │                  │
        ▼                ▼                  ▼                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Express API Backend                              │
│              Server-Side Route Handlers & Auth Session                 │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ /api/facilities │ /api/trips &     │ /api/incidents  │ /api/ai/        │
│ & Geo Queries   │ /api/trips/check │ & Moderation    │ journey-advice  │
└────────┬────────┴────────┬─────────┴────────┬────────┴────────┬────────┘
         │                 │                  │                 │
         ▼                 ▼                  ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐
│  Scoring Engine  │  │  Guardian State  │  │   Gemini 3.8 Flash SDK      │
│ 0.30F+0.25T+...  │  │  Machine Worker  │  │  (Server-Side GenAI Client) │
└────────┬─────────┘  └────────┬─────────┘  └──────────────┬──────────────┘
         │                     │                           │
         └──────────────┬──────┴───────────────────────────┘
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Database Persistence Layer                         │
│  MongoDB Atlas Client (when MONGODB_URI set) or Embedded Mongo Store   │
│  Collections: users, trips, tripCheckins, safetyFacilities,           │
│               incidentReports, safetyEvents, trustedContacts           │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Collections

1. **`users`**: `_id`, `name`, `email`, `role` (`"user"` | `"moderator"`), `createdAt`.
2. **`trustedContacts`**: `_id`, `userId`, `name`, `phone`, `relationship`, `consentStatus` (`"verified"` | `"pending"`), `createdAt`.
3. **`safetyFacilities`**: `_id`, `name`, `facilityType` (`"police"`, `"pharmacy_247"`, `"transit_hub"`, `"safe_haven"`), `city`, `location` (`{ type: "Point", coordinates: [lng, lat] }`), `address`, `phone`, `verificationStatus`, `verifiedAt`.
4. **`trips`**: `_id`, `userId`, `city`, `origin` (`{ name, coords }`), `destination` (`{ name, coords }`), `status` (`"PLANNED"`, `"ACTIVE"`, `"COMPLETED"`, `"ALERT"`), `routeReadinessScore`, `checkinIntervalMinutes`, `startedAt`, `endedAt`, `createdAt`.
5. **`tripCheckins`**: `_id`, `tripId`, `userId`, `checkpointNumber`, `dueAt`, `checkedInAt`, `status` (`"ON_TIME"`, `"LATE"`, `"MISSED"`).
6. **`incidentReports`**: `_id`, `reporterId`, `category` (`"LIGHTING"`, `"SUSPICIOUS"`, `"HAZARD"`, `"HARASSMENT"`), `city`, `location` (`{ coordinates: [lng, lat], approximateAddress }`), `description`, `occurredAt`, `reviewStatus` (`"UNDER_REVIEW"`, `"APPROVED"`, `"REJECTED"`), `createdAt`.
7. **`safetyEvents`**: `_id`, `tripId`, `userId`, `eventType` (`"CHECKIN_LOGGED"`, `"CHECKIN_OVERDUE"`, `"SOS_TRIGGERED"`, `"ALERT_CANCELLED"`, `"ALERT_RESOLVED"`), `severity` (`"INFO"`, `"WARNING"`, `"CRITICAL"`), `simulationMode: true`, `metadata`, `createdAt`.

---

### 5. Implementation Phases & Milestones

1. **Phase 1: Backend Foundation & Persistence Engine**
   - Implement Express server with modular routers (`/api/facilities`, `/api/trips`, `/api/incidents`, `/api/contacts`, `/api/safety`, `/api/ai`).
   - Create unified MongoDB driver adapter with fallback to embedded storage engine.
   - Seed pre-configured verified facilities across San Francisco, London, and New York.
   - Implement deterministic route readiness scoring algorithm with unit-test verification.

2. **Phase 2: Core Frontend Shell & Navigation**
   - Set up Tailwind CSS design tokens: midnight background, teal/mint accents, tabular numerals, clean top bar contract.
   - Build Landing page with interactive mechanisms, responsible safety statement, and demo city switcher.
   - Build App Layout with desktop sidebar + top header, and mobile bottom bar.

3. **Phase 3: Journey Planner & Map Interface**
   - MapLibre interactive canvas with route rendering, city preset controls, and facility marker popups.
   - Route comparison cards with 4-factor scoring breakdown, confidence ratings, and missing-data warnings.
   - Server-side Gemini AI journey advice generator with structured output.

4. **Phase 4: Journey Guardian & SOS Simulation**
   - Active journey state machine (`IDLE` $\rightarrow$ `ACTIVE` $\rightarrow$ `CHECKIN_DUE` $\rightarrow$ `ALERT_PENDING` $\rightarrow$ `ALERT_SIMULATED` $\rightarrow$ `RESOLVED`).
   - Real-time countdown timer, check-in button, and overdue event logger.
   - Simulated emergency panic trigger: Web Audio siren oscillator, modal countdown cancellation, and simulated SMS dispatch audit trail.

5. **Phase 5: Community Intelligence, Facilities Directory & Settings**
   - Facilities search, category filters, and distance calculator.
   - Community incident reporting flow with Gemini auto-categorization.
   - Moderator review dashboard with approve/reject controls.
   - Trusted contacts management with simulated invitation and test broadcast.
   - Journey history, event audit log, and analytics charts.

6. **Phase 6: Verification, Automated Testing & Documentation**
   - Run type checks and compilation tests.
   - Run unit tests for score calculation, missing data handling, and state machine transitions.
   - Provide comprehensive documentation: README, Windows install guide, Atlas setup guide, and 7-hour demo pitch script.
