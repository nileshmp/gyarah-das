# Graph Report - .  (2026-06-13)

## Corpus Check
- Corpus is ~13,927 words - fits in a single context window. You may not need a graph.

## Summary
- 62 nodes · 90 edges · 9 communities (7 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.82)
- Token cost: 12,000 input · 1,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Audio Recording Engine|Audio Recording Engine]]
- [[_COMMUNITY_Project Configuration|Project Configuration]]
- [[_COMMUNITY_Server and Safety Net|Server and Safety Net]]
- [[_COMMUNITY_Field Session Records|Field Session Records]]
- [[_COMMUNITY_Onboarding Conversation Flow|Onboarding Conversation Flow]]
- [[_COMMUNITY_Web Speech UI and Dev Tools|Web Speech UI and Dev Tools]]
- [[_COMMUNITY_Maternal Care Logic|Maternal Care Logic]]
- [[_COMMUNITY_Programme Identity|Programme Identity]]
- [[_COMMUNITY_Documentation|Documentation]]

## God Nodes (most connected - your core abstractions)
1. `index.html — Web Speech API Onboarding App` - 12 edges
2. `public/index.html — OpenAI Realtime Onboarding App` - 11 edges
3. `Call Record HTML Format (per-session saved record)` - 8 edges
4. `Onboarding Conversation Flow (Parts A–F)` - 6 edges
5. `fromServer()` - 5 edges
6. `finalize()` - 5 edges
7. `Local Support Team (ASHA, AWW, ANM, Gram Sathi, SHG, Transport)` - 5 edges
8. `Call Record — Rinku Devi Age 23 First Trimester Anwa (11:10:55)` - 5 edges
9. `Village: Anwa — Local Safety Net Mapped` - 5 edges
10. `fromClient()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Web Speech API Mode (Browser-only, no backend)` --semantically_similar_to--> `OpenAI Realtime Mode (WebSocket relay, server-side key)`  [INFERRED] [semantically similar]
  index.html → public/index.html
- `CLAUDE.md — Project Instructions` --references--> `index.html — Web Speech API Onboarding App`  [INFERRED]
  CLAUDE.md → index.html
- `public/mic-test.html — Microphone & Speech Diagnostic` --conceptually_related_to--> `index.html — Web Speech API Onboarding App`  [INFERRED]
  public/mic-test.html → index.html
- `Call Record — Rinku Devi Age 23 First Trimester Anwa (11:10:55)` --references--> `First Trimester Care Checklist (IFA, TT, check-up, rest, nutrition, AWC registration)`  [INFERRED]
  data/2026-06-13T11-10-55_rinku_devi/record.html → public/index.html
- `index.html — Web Speech API Onboarding App` --implements--> `Onboarding Conversation Flow (Parts A–F)`  [EXTRACTED]
  index.html → public/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Voice Onboarding Pipeline: Consent -> Profile -> Village Lookup -> Care Guidance** — consent_gate, beneficiary_profile, safety_net_directory, onboarding_conversation_flow [EXTRACTED 0.95]
- **Dual-Mode Architecture: Web Speech API (index.html) vs OpenAI Realtime (public/index.html)** — index_html, public_index_html, web_speech_api_mode, openai_realtime_mode [INFERRED 0.85]
- **Anwa Village Support Network: ASHA Rinku Devi, ANM Rani Devi, AWW Manju Devi, Gram Sathi, SHG** — village_anwa, local_support_team, safety_net_directory [EXTRACTED 0.95]

## Communities (9 total, 2 thin omitted)

### Community 0 - "Audio Recording Engine"
Cohesion: 0.30
Nodes (10): clean(), esc(), finalize(), fromClient(), fromServer(), mix(), ms(), pcmFromB64() (+2 more)

### Community 1 - "Project Configuration"
Cohesion: 0.20
Nodes (9): dependencies, ws, description, name, private, scripts, start, type (+1 more)

### Community 2 - "Server and Safety Net"
Cohesion: 0.22
Nodes (7): SAFETY_NET, newRecording(), DATA_DIR, MIME, PUBLIC_DIR, server, wss

### Community 3 - "Field Session Records"
Cohesion: 0.25
Nodes (9): Call Record HTML Format (per-session saved record), Call Record — ABC.DEF Age 32 (09:24:37), Call Record — Anonymous Beneficiary (09:22:47), Call Record — Anonymous Beneficiary Short (09:31:12), Call Record — Anonymous Beneficiary (11:08:38), Call Record — Neelam Kumari Age 20 Anwa (11:06:48), Call Record — Rinku Devi Age 22 Anwa (11:09:19), Safety Net Directory — Anwa Village Stakeholders (+1 more)

### Community 4 - "Onboarding Conversation Flow"
Cohesion: 0.38
Nodes (7): Beneficiary Profile (name, age, mobile, village), Consent Gate — Beneficiary Consent Before Data Collection, Gyarah Das Programme, Onboarding Conversation Flow (Parts A–F), OpenAI Realtime Mode (WebSocket relay, server-side key), OpenAI Realtime Function Tools (update_profile, lookup_village, record_field, get_contact_number, end_call), public/index.html — OpenAI Realtime Onboarding App

### Community 5 - "Web Speech UI and Dev Tools"
Cohesion: 0.33
Nodes (6): CLAUDE.md — Project Instructions, index.html — Web Speech API Onboarding App, public/mic-test.html — Microphone & Speech Diagnostic, Screen + Voice Recording (MediaRecorder, Web Audio mixing), Turn-Taking Timing (pause detection, overall timeout, auto-restart), Web Speech API Mode (Browser-only, no backend)

### Community 6 - "Maternal Care Logic"
Cohesion: 0.40
Nodes (5): First Trimester Care Checklist (IFA, TT, check-up, rest, nutrition, AWC registration), Local Support Team (ASHA, AWW, ANM, Gram Sathi, SHG, Transport), Pregnancy Trimester Detection Logic, Call Record — ABC.DEF Second Trimester Ayodhya (09:31:53), Call Record — Rinku Devi Age 23 First Trimester Anwa (11:10:55)

## Knowledge Gaps
- **22 isolated node(s):** `name`, `version`, `private`, `type`, `description` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `index.html — Web Speech API Onboarding App` connect `Web Speech UI and Dev Tools` to `Field Session Records`, `Onboarding Conversation Flow`, `Maternal Care Logic`, `Programme Identity`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `public/index.html — OpenAI Realtime Onboarding App` connect `Onboarding Conversation Flow` to `Field Session Records`, `Maternal Care Logic`, `Programme Identity`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Call Record HTML Format (per-session saved record)` connect `Field Session Records` to `Maternal Care Logic`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `index.html — Web Speech API Onboarding App` (e.g. with `CLAUDE.md — Project Instructions` and `public/mic-test.html — Microphone & Speech Diagnostic`) actually correct?**
  _`index.html — Web Speech API Onboarding App` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._