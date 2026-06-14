// Records a Gyarah Das call by tapping the events flowing through the relay,
// then writes three artifacts to data/<timestamp>_<name>/ :
//   - record.json         machine-readable
//   - record.html         a readable "form" anyone can open
//   - conversation.wav    the whole call as audio (mother + Rupa Devi mixed)

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SR = 24000; // PCM sample rate used by the Realtime API

// The app supports ONLY English (Latin) and Hindi (Devanagari). The transcriber
// sometimes hallucinates other scripts (Arabic/Urdu, Korean, Chinese, Cyrillic…)
// on noise. Drop any transcript containing such a script so junk never reaches
// the saved record. Devanagari (U+0900–U+097F) is intentionally left OUT of this
// set so Hindi passes; the range is split around it. Mirrors the browser filter.
const FOREIGN_SCRIPT = /[Ͱ-ࣿঀ-᳿　-鿿가-힯豈-﫿]/;
const isCleanText = (s) => typeof s === "string" && s.trim() !== "" && !FOREIGN_SCRIPT.test(s);

export function newRecording() {
  return {
    startedAt: Date.now(),
    profile: {},     // name, age, mobile, village
    fields: [],      // { section, label, value, t }
    contacts: [],    // { stakeholder, t }  (resolved to name/mobile at finalize)
    transcript: [],  // { who, text, t }
    mother: [],      // { t, pcm:Int16Array }
    rupa: [],        // { t, pcm:Int16Array }
  };
}

const ms = (rec) => Date.now() - rec.startedAt;

function pcmFromB64(b64) {
  const buf = Buffer.from(b64, "base64");
  const len = buf.byteLength - (buf.byteLength % 2);
  const out = new Int16Array(len / 2);
  for (let i = 0; i < out.length; i++) out[i] = buf.readInt16LE(i * 2);
  return out;
}

// Messages the browser sends up to OpenAI (the mother's mic audio)
export function fromClient(rec, msg) {
  if (msg.type === "input_audio_buffer.append" && msg.audio) {
    rec.mother.push({ t: ms(rec), pcm: pcmFromB64(msg.audio) });
  }
}

// Messages OpenAI sends down (Rupa Devi's audio, transcripts, tool calls)
export function fromServer(rec, msg) {
  switch (msg.type) {
    case "response.output_audio.delta":
      if (msg.delta) rec.rupa.push({ t: ms(rec), pcm: pcmFromB64(msg.delta) });
      break;
    case "response.output_audio_transcript.done":
      if (isCleanText(msg.transcript)) rec.transcript.push({ who: "Rupa Devi", text: msg.transcript, t: ms(rec) });
      break;
    case "conversation.item.input_audio_transcription.completed":
      // Only save English/Hindi; drop foreign-script noise hallucinations.
      if (isCleanText(msg.transcript)) rec.transcript.push({ who: "Mother", text: msg.transcript, t: ms(rec) });
      break;
    case "response.function_call_arguments.done": {
      let a = {};
      try { a = JSON.parse(msg.arguments || "{}"); } catch {}
      if (msg.name === "update_profile") Object.assign(rec.profile, clean(a));
      else if (msg.name === "record_field" && a.label)
        rec.fields.push({ section: a.section || "General", label: a.label, value: a.value ?? "", t: ms(rec) });
      else if (msg.name === "get_contact_number" && a.stakeholder)
        rec.contacts.push({ stakeholder: a.stakeholder, t: ms(rec) });
      break;
    }
  }
}

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null && v !== ""));

// Mix the two timelines into one mono track at their real time offsets
function mix(rec) {
  const all = [...rec.mother, ...rec.rupa];
  if (all.length === 0) return new Int16Array(0);
  let maxEnd = 0;
  for (const c of all) maxEnd = Math.max(maxEnd, Math.floor((c.t / 1000) * SR) + c.pcm.length);
  const acc = new Float32Array(maxEnd);
  for (const c of all) {
    const off = Math.floor((c.t / 1000) * SR);
    for (let i = 0; i < c.pcm.length; i++) {
      const idx = off + i;
      if (idx < maxEnd) acc[idx] += c.pcm[i] / 32768;
    }
  }
  const out = new Int16Array(maxEnd);
  for (let i = 0; i < maxEnd; i++) {
    const s = Math.max(-1, Math.min(1, acc[i]));
    out[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return out;
}

function wav(int16, sr) {
  const dataLen = int16.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(dataLen, 40);
  for (let i = 0; i < int16.length; i++) buf.writeInt16LE(int16[i], 44 + i * 2);
  return buf;
}

const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const mmss = (t) => { const s = Math.floor(t / 1000); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

function renderHtml(r) {
  const rows = (obj) => Object.entries(obj).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("");
  const sections = {};
  for (const f of r.capturedDetails) (sections[f.section] ||= []).push(f);
  const detailBlocks = Object.entries(sections).map(([sec, items]) => `
    <h3>${esc(sec)}</h3>
    <table>${items.map((i) => `<tr><td>${esc(i.label)}</td><td>${esc(i.value)}</td></tr>`).join("")}</table>`).join("");
  const contacts = r.contactsShared.length
    ? `<h3>Contacts shared with her</h3><table>${r.contactsShared.map((c) => `<tr><td>${esc(c.stakeholder)}</td><td>${esc(c.name || "")}</td><td>${esc(c.mobile || "")}</td></tr>`).join("")}</table>`
    : "";
  const convo = r.transcript.map((m) => `<p class="${m.who === "Rupa Devi" ? "a" : "u"}"><span class="t">${mmss(m.t)}</span><b>${esc(m.who)}:</b> ${esc(m.text)}</p>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gyarah Das — Call Record</title>
<style>body{font-family:"Segoe UI",sans-serif;max-width:760px;margin:24px auto;color:#2b2620;padding:0 16px}
h1{color:#8c4a12}h3{color:#8c4a12;margin-top:22px;border-bottom:1px solid #ece5da;padding-bottom:4px}
table{border-collapse:collapse;width:100%;margin:6px 0}td{padding:6px 8px;border-bottom:1px dashed #ece5da;vertical-align:top}
td:first-child{color:#7a7368;width:38%}.meta{color:#7a7368;font-size:14px}
.convo p{margin:6px 0;line-height:1.4}.convo .a{color:#2e7d5b}.convo .u{color:#3a4a6b}
.convo .t{color:#b3aa9c;font-size:12px;margin-right:8px}audio{width:100%;margin:10px 0}</style></head>
<body>
<h1>Gyarah Das — Call Record</h1>
<p class="meta">${esc(r.startedAt)} &middot; duration ${Math.floor(r.durationSec/60)}m ${r.durationSec%60}s</p>
<audio controls src="conversation.wav"></audio>
<h3>Beneficiary Profile</h3><table>${rows(r.profile)}</table>
${detailBlocks}
${contacts}
<h3>Full Conversation</h3><div class="convo">${convo}</div>
</body></html>`;
}

export async function finalize(rec, SAFETY_NET, dataDir) {
  if (rec.transcript.length === 0 && rec.mother.length === 0) return null; // nothing happened

  const vkey = (rec.profile.village || "").toLowerCase().replace(/[^a-z]/g, "");
  const STOP = new Set(["phc","chc","primary","health","centre","center","community","district","hospital","nagar","clinic"]);
  // Match the village name, or a facility town (Saifni/Shahabad/Rampur) that serves it.
  const villageKey = Object.keys(SAFETY_NET).find((k) => {
    if (vkey.includes(k)) return true;
    const fac = SAFETY_NET[k].facilities || {};
    for (const fk in fac) {
      for (const t of (fac[fk].name || "").toLowerCase().match(/[a-z]+/g) || []) {
        if (t.length >= 4 && !STOP.has(t) && vkey.includes(t)) return true;
      }
    }
    return false;
  });
  const dir = villageKey ? SAFETY_NET[villageKey] : null;
  const contactsShared = rec.contacts.map((c) => {
    const s = dir && dir.stakeholders[c.stakeholder];
    return s ? { stakeholder: c.stakeholder, name: s.name, mobile: s.mobile } : { stakeholder: c.stakeholder };
  });

  const safeName = (rec.profile.name || "beneficiary").replace(/[^a-z0-9]+/gi, "_").toLowerCase().slice(0, 30);
  const stamp = new Date(rec.startedAt).toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const folder = join(dataDir, `${stamp}_${safeName}`);
  await mkdir(folder, { recursive: true });

  const record = {
    startedAt: new Date(rec.startedAt).toISOString(),
    durationSec: Math.round((Date.now() - rec.startedAt) / 1000),
    profile: rec.profile,
    capturedDetails: rec.fields,
    contactsShared,
    transcript: rec.transcript,
  };

  await writeFile(join(folder, "record.json"), JSON.stringify(record, null, 2), "utf-8");
  await writeFile(join(folder, "record.html"), renderHtml(record), "utf-8");
  const audio = mix(rec);
  if (audio.length) await writeFile(join(folder, "conversation.wav"), wav(audio, SR));

  return folder;
}
