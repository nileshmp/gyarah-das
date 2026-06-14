# CLAUDE.md — Gyarah Das Voice Companion

This file is the working memory for this project. Read it first. It captures what
we are building, why, the current architecture, the conversation flow, the rules,
and the decisions made so far. It is a **living document** — the owner will keep
changing requirements; update this file as the project evolves.

---

## 1. What this project is

**Gyarah Das** ("Eleven [±10] Days") is a **voice-first AI companion** for mothers
during the **first 1000 days** (conception → child's 2nd birthday). It is built for
rural Uttar Pradesh (Integrated Command and Control Centre, ICCC).

The core idea (from the Concept Note): India already has the maternal-child safety
net — ASHA/ANM/Anganwadi workers, PHC/CHC/District hospitals, schemes (JSY, PMMVY,
JSSK), 102/108 ambulances. What is missing is a **continuous demand-generation and
navigation layer** that engages each mother by her current life-stage and connects
her to the right service at the right time. Gyarah Das is that layer.

The agent persona is **Rupa Devi** — a warm, trusted "elder sister" voice, not a
call-centre agent.

**Source documents** (in repo root, background only):
- `Gyarah Das Concept Note.docx` — the vision / "why".
- `Gyarah Das Knoweldge Base.docx` — the scripted conversation flow / "how".
- `GYARAH DAS DEMO SCRIPT.pdf`, `Gyarah Das Hackthon.pptx` — supporting material.

---

## 2. Product decisions locked so far

These were chosen explicitly by the owner. Do not change without asking.

| Decision | Choice | Notes |
|---|---|---|
| Interaction | **Real two-way voice** | Speech in, speech out |
| First slice | **Onboarding → full first-trimester (Q1) flow** | Whole scripted conversation |
| Language | **English first** | Hindi + rural accents come later |
| Platform | **Web app** | Phone/IVR deployment is a later step |
| Voice engine | **OpenAI Realtime API (GA, speech-to-speech)** | Most lifelike; native turn-taking |
| **Auth** | **API key used DIRECTLY, server-side. NO TOKENS.** | See §4 — this is a hard rule |
| Test village | **Anwa** | The only village currently in the directory |

---

## 3. CRITICAL RULE — No tokens, ever

The owner is **emphatic**: we must **NOT** mint or use any ephemeral/realtime
session token. The OpenAI **API key is used directly**, only on the server, in the
`Authorization: Bearer <key>` header of the server's own WebSocket to OpenAI.

- The key comes from the environment variable `OPENAI_API_KEY` (the owner sets it
  in their shell; there is no committed `.env`).
- The key **never** reaches the browser. The browser only ever talks to our server.
- There is **no** `/session` endpoint, no `client_secret`, no ephemeral token.

If you ever feel tempted to use the WebRTC + ephemeral-token pattern (OpenAI's
"recommended" browser flow): **don't.** Use the relay.

---

## 4. Architecture — the tokenless relay

```
Browser  ──WebSocket (/realtime)──►  Our Node server  ──WebSocket + API key──►  OpenAI Realtime
   mic PCM16 @24kHz                   relays both ways                          Rupa Devi audio + events
   plays back audio                   (also records the call)
```

- The browser captures the mic, converts to **PCM16 @ 24 kHz**, base64-encodes it,
  and sends `input_audio_buffer.append` events through the relay.
- OpenAI streams back `response.output_audio.delta` (PCM16) which the browser plays
  via the Web Audio API. Turn-taking is handled by OpenAI **server VAD**.
- The server is a **dumb relay** for the conversation (forwards every message both
  ways) **plus** a passive **recorder** (taps the relayed events to save the call).

### Files

| File | Role |
|---|---|
| `server.js` | HTTP + WebSocket relay. Holds the key. Serves static files, `/config`, `/knowledge`. Wires the recorder. |
| `public/index.html` | The **English** voice client: WebRTC-free audio capture/playback, the conversation instructions, tools, and on-screen UI (transcript, profile, captured details, contacts). |
| `public/hindi.html` | The **Hindi** voice client. A copy of `index.html` with the same audio/relay/timer logic, but Hindi `INSTRUCTIONS`, Hindi UI strings, `transcription.language:"hi"`, a Devanagari-aware noise filter, and it fetches `/knowledge-hi`. **Keep English untouched — change Hindi here only.** |
| `public/landing.html` | Language picker shown at `/` (Hindi on top, English below) → links to `/Hindi` and `/English`. |
| `public/safety-net.js` | **Single source of truth** for the village directory (stakeholder names + **phone numbers**) and facilities. Imported by BOTH server (Node) and browser (ES module). Shared by both languages. |
| `knowledge-base.md` | Rupa Devi's editable **English** reference knowledge. Served redacted at `/knowledge`. |
| `knowledge-base.hi.md` | The **Hindi** reference knowledge (same content, translated). Served redacted at `/knowledge-hi`. |
| `recorder.js` | Captures audio + transcript + structured data from the relay; writes the 3 artifacts to `data/`. |
| `index.html` (root) | The OLD Web Speech API prototype (no AI). Kept for reference; served at `/speech`. |
| `data/` | Saved calls (one folder per call). |
| `package.json` | `npm start` → `node --env-file-if-exists=.env server.js`. Dependency: `ws`. |
| `.env.example` | Template only. Real key lives in the OS env var, not a committed file. |

### Server endpoints
- `GET /` → `public/landing.html` (language picker: Hindi on top, English below)
- `GET /English` → `public/index.html` (English app)
- `GET /Hindi` → `public/hindi.html` (Hindi app — same flow/logic, fully translated)
- `GET /config` → `{ model, voice, noiseReduction }`
- `GET /knowledge-hi` → `knowledge-base.hi.md`, redacted (Hindi knowledge base)
- `GET /knowledge` → `knowledge-base.md`, **re-read each call**, with phone numbers **redacted** (regex `\d[\d\s-]{8,}\d`). Helplines 102/108 and distances survive.
- `GET /speech` → the old Web Speech prototype
- `WS /realtime` → the relay

---

## 5. OpenAI Realtime — GA specifics (don't regress to Beta)

The **Beta** Realtime API is **retired**. We use **GA**. Key differences that bit us:

- **No `OpenAI-Beta: realtime=v1` header.** Just `Authorization: Bearer <key>`.
- Model: **`gpt-realtime`** (override via `REALTIME_MODEL`). Voice: **`marin`**
  (override via `REALTIME_VOICE`). If a model name 404s, try `gpt-realtime-2` or a
  dated snapshot.
- **GA session schema** (nested `audio.input` / `audio.output`):
  ```js
  session: {
    type: "realtime",
    output_modalities: ["audio"],
    instructions: "...",
    audio: {
      input:  { format:{type:"audio/pcm",rate:24000}, noise_reduction:{type:"far_field"}, turn_detection:{type:"server_vad",threshold:0.7,prefix_padding_ms:300,silence_duration_ms:800}, transcription:{model:"gpt-4o-mini-transcribe",language:"en"} },
      output: { format:{type:"audio/pcm",rate:24000}, voice:"marin" }
    },
    tools: [...], tool_choice: "auto"
  }
  ```
- **GA event names** (renamed from Beta):
  - assistant audio chunk: `response.output_audio.delta`
  - assistant transcript: `response.output_audio_transcript.delta` / `.done`
  - user transcript: `conversation.item.input_audio_transcription.completed`
  - barge-in: `input_audio_buffer.speech_started` (flushes playback so the mother can
    interrupt) — BUT this is suppressed once `end_call` has fired (`pendingEnd`), so echo
    or noise cannot cut off the final goodbye.
  - tool call: `response.function_call_arguments.done`
  - end of a turn: `response.done`
  - client appends audio with: `input_audio_buffer.append`
- **Noise / hallucination guardrails** (added after garbage foreign-script transcripts
  like Korean appeared on room noise, then expanded for rural background noise):
  - **Server-side noise reduction** (`audio.input.noise_reduction`) removes steady
    background noise (fan, traffic) before VAD/transcription. Mode comes from `/config`
    (env `REALTIME_NOISE_REDUCTION`, default `far_field`; `near_field` for phone-to-ear;
    `off`/`none` omits the field). Browser-level `noiseSuppression`/`echoCancellation`
    in getUserMedia stay on as a first layer.
  - Transcription is `gpt-4o-mini-transcribe` with `language:"en"` (whisper-1
    hallucinated random languages on silence; pinning English + the newer model fixes it),
    plus a `prompt` listing local place/role names (Anwa, Saifni, Shahabad, Rampur, PHC,
    CHC, ASHA, ANM, …) so rural names aren't misheard.
  - VAD `threshold:0.7` + `prefix_padding_ms:300` + `silence_duration_ms:800` so breaths /
    background noise don't trip a false turn.
  - Client drops any transcript containing non-Latin script (treats it as noise: not shown,
    does NOT reset the silence wait). See `handleEvent` in `public/index.html`.
  - Instructions forbid inventing an answer; if input is unclear the agent stays quiet.
- **Silence handling (current):** ask each question ONCE, then wait **20 seconds** of real
  silence; if no clear answer, the client injects a `[SYSTEM]` goodbye nudge and ends the
  call. NO repeating the question. The 20s countdown only starts after Rupa Devi's audio
  finishes playing (`startSilenceTimer` adds remaining playback time), is armed at
  `response.done`, and is cancelled ONLY by a confirmed English transcription — never by
  `speech_started` (which fires on mic echo).
- **End-of-call drain:** `end_call` sets `endRequested`; the client waits for `response.done`
  then drains the audio queue (`waitForAudioThenEnd`) so the full goodbye plays before hangup.

---

## 6. The conversation flow (current, English)

Rupa Devi follows this in order. Full text lives in `INSTRUCTIONS` in
`public/index.html`; reference data is appended from `knowledge-base.md`.

1. **Onboarding** — greeting → **consent** (No → warm goodbye, `end_call`).
2. **Profile** — one question at a time: full name → age → mobile → village.
   Calls `update_profile` per field; after village calls `lookup_village`.
3. **Beneficiary type** — "Are you pregnant?"
   - Yes → **Pregnancy registration**: find the trimester from last menstrual period
     (LMP) or months pregnant; if unknown, ask her to find out and call back.
   - No → "Child under two?"
     - Yes → **Lactating registration**: child DOB/age → quarter; **new registration
       only if child ≤ 18 months**; support continues to 24 months.
     - No → out of scope → warm close.
4. **Local Support System Introduction** (right after registration) — introduce her
   ASHA / ANM / Anganwadi worker **by name**, plus PHC/CHC/District hospital with
   distances & travel times, Gram Sathi, SHG, and emergency transport. **No phone
   numbers read aloud.**
5. **First-trimester (Q1) care** (only if Q1) — gently, one topic at a time, with
   `record_field` for each answer and demand-generation where there's a gap:
   (a) told ASHA & Anganwadi? (b) pregnancy check-up done — facility, BP, abdominal
   exam, weight, haemoglobin, abnormality; (c) IFA tablets — received/count/adherence/
   reason; (d) TT injection; (e) afternoon rest; (f) one extra meal; (g) Anganwadi
   registration & Take Home Ration.
6. **Warm close** → `end_call`.

**Quarter framework:** Pregnancy Q1 (0–3m) / Q2 (4–6m) / Q3 (7–9m). Child Q4 (0–90d)
… Q9 (16–18m), continuing Q10/Q11 to 24 months. **Only Q1 is fully scripted so far**
(matches the source Knowledge Base). Other quarters: do the support intro and a warm
close noting detailed guidance is coming.

---

## 7. Conversational rules & regulations (must follow)

From the Knowledge Base persona/communication rules:
- **One question at a time.** Wait and listen. Never stack questions.
- **Warm, simple language.** No jargon ("pregnancy check-up", not "ANC"). Acknowledge
  every answer. It should feel like support, not a survey.
- **Never overwhelm** — only discuss the current stage.
- **Consent first.** No consent → thank and end.
- **Contact-sharing rule (important):** never share a worker's phone number
  proactively. Share **only** when (a) she asks, (b) a real service gap/referral
  needs it. The agent uses the `get_contact_number` tool for this; numbers are
  **redacted** from the agent's general knowledge so it *can't* leak them.
- **Helplines 102 / 108** are public and may be said aloud.
- **She can stop anytime** — if she declines or wants to end, never push; thank her
  warmly, invite her to call back, `end_call`.

---

## 8. Tools (function calling)

Defined in `public/index.html` (`TOOLS`), executed in the browser (`runTool`), and
also observed by the server recorder.

| Tool | Purpose |
|---|---|
| `update_profile{name,age,mobile,village}` | Fill profile fields as learned |
| `lookup_village{village}` | Returns local worker **names** + facilities (NO numbers) for the support intro |
| `record_field{section,label,value}` | Record any concrete fact (drives the saved form) |
| `get_contact_number{stakeholder}` | Returns a phone number — **only when she asks** |
| `end_call{reason}` | Graceful end |

`stakeholder` enum: `ASHA, ANM, AWW, gramSathi, shg, transport`.

---

## 9. Knowledge base = editable "memory"

`knowledge-base.md` is loaded into Rupa Devi's instructions at the start of **every**
call via `GET /knowledge`. It is **re-read each call**, so edits take effect on the
next call with **no restart**. Add villages, facilities, schemes, or details there.

- Phone numbers in the file are **automatically redacted** server-side before the
  agent sees them (humans can still read them in the file; the agent shares numbers
  only via the secure tool).
- Structured numbers used by the tool live in `public/safety-net.js`.

---

## 10. Call recording — every call auto-saves

On call end, `recorder.js` writes to `data/<ISO-timestamp>_<name>/`:
- `record.json` — machine-readable (profile, captured details, contacts shared, transcript).
- `record.html` — a readable **form** anyone can open (with an embedded audio player).
- `conversation.wav` — the whole call, mother + Rupa Devi mixed on one 24 kHz timeline.

Recording is **server-side and passive** (taps relayed events), so it cannot disrupt
the live call. It fires on the browser/upstream WebSocket close.

---

## 11. How to run

```powershell
# 1. Key must be in the environment of the terminal you start the server in:
$env:OPENAI_API_KEY = "sk-..."        # or set persistently with setx + new terminal
echo $env:OPENAI_API_KEY              # confirm it prints

# 2. Start
npm start                             # expect "✓ API key loaded" + "Mode: tokenless relay"

# 3. Open in Google Chrome
#    http://localhost:3000
#    Hard-refresh (Ctrl+Shift+R) after any client change.
#    Allow the microphone. Headphones recommended (avoids echo into the mic).
```

**Gotchas:**
- Only **one** server can hold port 3000. Kill stale `node` processes if you hit `EADDRINUSE`.
- Always **hard-refresh** the browser after editing `public/` files.
- Watch the **server terminal** — it logs the relay handshake (`✓ OpenAI connected`)
  and any OpenAI rejection (HTTP 401 key / 403 access / 404 model), plus `💾 Call saved`.
- Node 24 has a built-in `.env` loader and global `fetch`; the only npm dep is `ws`.

---

## 12. Deferred / coming up

The owner will drive these. Not yet built:
- **Hindi voice/transcription quality** — the Hindi flow is built (`/Hindi`), but the voice
  (`marin`) and Hindi rural-accent transcription still need real-call testing; the Hindi
  script translation should also get a native-speaker review for tone.
- **Detailed scripts for quarters beyond Q1** (Q2–Q11). Source KB only details Q1.
- **More villages/facilities** in `safety-net.js` + `knowledge-base.md`.
- **Phone / IVR deployment** (currently a web app).
- A **dashboard** to browse saved calls in `data/`.
- Persisting profiles across calls / backend database (currently per-call files only).

---

## 13. Conventions for future changes

- Keep the **no-tokens** rule (§3) absolutely. Key stays server-side.
- Conversation logic & persona → `INSTRUCTIONS` in `public/index.html`.
- Reference facts Rupa Devi should *know/say* → `knowledge-base.md` (human-editable).
- Contact numbers / structured directory → `public/safety-net.js` (single source).
- New saved fields → emit via `record_field`; the recorder + form pick them up automatically.
- Match GA event names and session schema (§5) — do not reintroduce Beta shapes.
- After client edits, remind to hard-refresh; after server edits, restart.
```

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
