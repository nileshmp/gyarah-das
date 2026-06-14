# Graph Report - .  (2026-06-13)

## Corpus Check
- Corpus is ~12,814 words - fits in a single context window. You may not need a graph.

## Summary
- 63 nodes · 85 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.84)
- Token cost: 70,811 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Call Recording Engine|Call Recording Engine]]
- [[_COMMUNITY_Live Voice Client & Relay|Live Voice Client & Relay]]
- [[_COMMUNITY_Package Manifest|Package Manifest]]
- [[_COMMUNITY_Relay Server & Directory|Relay Server & Directory]]
- [[_COMMUNITY_Conversation Flow & Persona|Conversation Flow & Persona]]
- [[_COMMUNITY_Web Speech Prototype|Web Speech Prototype]]
- [[_COMMUNITY_Village Safety-Net Directory|Village Safety-Net Directory]]
- [[_COMMUNITY_Emergency Helplines|Emergency Helplines]]

## God Nodes (most connected - your core abstractions)
1. `Rupa Devi INSTRUCTIONS prompt` - 6 edges
2. `fromServer()` - 5 edges
3. `finalize()` - 5 edges
4. `handleEvent (Realtime event handler)` - 5 edges
5. `start (connect + session.update)` - 5 edges
6. `fromClient()` - 4 edges
7. `Conversation flow (onboarding → Q1)` - 4 edges
8. `Local Support Team — Anwa` - 4 edges
9. `runTool (tool dispatcher)` - 4 edges
10. `villageDir (SAFETY_NET lookup)` - 4 edges

## Surprising Connections (you probably didn't know these)
- `runOnboarding (Web Speech prototype flow)` --semantically_similar_to--> `Rupa Devi INSTRUCTIONS prompt`  [INFERRED] [semantically similar]
  index.html → public/index.html
- `Gyarah Das Demo Script` --references--> `Conversation flow (onboarding → Q1)`  [INFERRED]
  GYARAH DAS DEMO SCRIPT.pdf → CLAUDE.md
- `1000-Day Quarter Framework (KB)` --semantically_similar_to--> `1000-day quarter framework`  [INFERRED] [semantically similar]
  knowledge-base.md → CLAUDE.md
- `Gyarah Das Demo Script` --references--> `Rupa Devi persona`  [INFERRED]
  GYARAH DAS DEMO SCRIPT.pdf → CLAUDE.md
- `lookupVillage (prototype)` --semantically_similar_to--> `villageDir (SAFETY_NET lookup)`  [INFERRED] [semantically similar]
  index.html → public/index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Live Realtime voice call flow (client)** — public_index_start, public_index_handleevent, public_index_runtool, public_index_audio_pipeline, public_index_silence_handler [EXTRACTED 1.00]
- **Tokenless relay design principle** — claude_no_tokens_rule, claude_tokenless_relay, claude_ga_realtime_schema, public_index_start [INFERRED 0.85]
- **Anwa safety-net directory (shared across files)** — knowledge_base_local_support_team, knowledge_base_health_facilities, index_safety_net, public_index_villagedir [INFERRED 0.85]

## Communities (8 total, 1 thin omitted)

### Community 0 - "Call Recording Engine"
Cohesion: 0.30
Nodes (10): clean(), esc(), finalize(), fromClient(), fromServer(), mix(), ms(), pcmFromB64() (+2 more)

### Community 1 - "Live Voice Client & Relay"
Cohesion: 0.24
Nodes (10): OpenAI Realtime GA session schema & events, No-tokens hard rule, Noise / hallucination guardrails, Gyarah Das Voice Companion (project overview), Tokenless relay architecture, Audio capture/playback pipeline, handleEvent (Realtime event handler), runTool (tool dispatcher) (+2 more)

### Community 2 - "Package Manifest"
Cohesion: 0.20
Nodes (9): dependencies, ws, description, name, private, scripts, start, type (+1 more)

### Community 3 - "Relay Server & Directory"
Cohesion: 0.22
Nodes (7): SAFETY_NET, newRecording(), DATA_DIR, MIME, PUBLIC_DIR, server, wss

### Community 4 - "Conversation Flow & Persona"
Cohesion: 0.28
Nodes (9): Contact-sharing / number-redaction rule, Conversation flow (onboarding → Q1), 1000-day quarter framework, Rupa Devi persona, Gyarah Das Demo Script, Gyarah Das programme description, 1000-Day Quarter Framework (KB), Government Schemes & Entitlements (+1 more)

### Community 5 - "Web Speech Prototype"
Cohesion: 0.33
Nodes (6): listenOnce (SpeechRecognition turn), runOnboarding (Web Speech prototype flow), Screen+voice MediaRecorder recording, speak (SpeechSynthesis utterance), Silence / no-response handler, Microphone & Speech diagnostic page

### Community 6 - "Village Safety-Net Directory"
Cohesion: 0.70
Nodes (5): lookupVillage (prototype), SAFETY_NET inline directory (prototype copy), Nearby Health Facilities — Anwa, Local Support Team — Anwa, villageDir (SAFETY_NET lookup)

## Knowledge Gaps
- **19 isolated node(s):** `name`, `version`, `private`, `type`, `description` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Rupa Devi INSTRUCTIONS prompt` connect `Conversation Flow & Persona` to `Live Voice Client & Relay`, `Web Speech Prototype`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `runOnboarding (Web Speech prototype flow)` connect `Web Speech Prototype` to `Conversation Flow & Persona`, `Village Safety-Net Directory`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `start (connect + session.update)` connect `Live Voice Client & Relay` to `Conversation Flow & Persona`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Rupa Devi INSTRUCTIONS prompt` (e.g. with `runOnboarding (Web Speech prototype flow)` and `Contact-sharing / number-redaction rule`) actually correct?**
  _`Rupa Devi INSTRUCTIONS prompt` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `handleEvent (Realtime event handler)` (e.g. with `OpenAI Realtime GA session schema & events` and `Noise / hallucination guardrails`) actually correct?**
  _`handleEvent (Realtime event handler)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `start (connect + session.update)` (e.g. with `OpenAI Realtime GA session schema & events` and `Noise / hallucination guardrails`) actually correct?**
  _`start (connect + session.update)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._