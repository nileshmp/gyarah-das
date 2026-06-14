// Gyarah Das — relay server (tokenless).
// The browser talks ONLY to this server over a WebSocket. This server holds the
// live OpenAI Realtime connection using your API key. No token is ever created,
// and your key never leaves this process.

import http from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import { SAFETY_NET } from "./public/safety-net.js";
import { newRecording, fromClient, fromServer, finalize } from "./recorder.js";

const PORT  = process.env.PORT || 3000;
const KEY   = process.env.OPENAI_API_KEY;
const DATA_DIR = join(process.cwd(), "data");

let CFG = {};
try {
  CFG = JSON.parse(await readFile(join(process.cwd(), "config.json"), "utf8"));
} catch { /* missing config.json is fine — all values fall back to defaults below */ }

let INSTRUCTIONS = "";
try {
  const inst = JSON.parse(await readFile(join(process.cwd(), "instructions_hi_v2.json"), "utf8"));
  const persona = inst.persona || "";
  const flow    = inst.instructions || "";
  INSTRUCTIONS  = persona && flow ? persona + "\n\n---\n\n" + flow : persona || flow;
} catch { /* instructions file missing — client will show an error */ }

const MODEL = process.env.REALTIME_MODEL || CFG.model || "gpt-realtime";
const VOICE = process.env.REALTIME_VOICE || CFG.voice || "marin";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico":  "image/x-icon",
};

const PUBLIC_DIR = join(process.cwd(), "public");

// ---------------------------------------------------------------------------
// HTTP: serve the page + a tiny /config endpoint
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/config") {
    return json(res, 200, { ...CFG, model: MODEL, voice: VOICE, instructions: INSTRUCTIONS });
  }

  // Old Web-Speech demo, kept for reference
  if (req.method === "GET" && (req.url === "/speech" || req.url === "/speech.html")) {
    try {
      const buf = await readFile(join(process.cwd(), "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(buf);
    } catch { res.writeHead(404); return res.end("Not found"); }
  }

  // Static files from /public
  const urlPath = req.url.split("?")[0];
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = normalize(join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    const buf = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

// ---------------------------------------------------------------------------
// WebSocket relay: browser  <->  this server  <->  OpenAI Realtime
// ---------------------------------------------------------------------------
const wss = new WebSocketServer({ server, path: "/realtime" });

wss.on("connection", (browser) => {
  console.log("→ Browser connected to relay.");
  if (!KEY) {
    console.error("✗ No OPENAI_API_KEY in this server's environment. Conversation cannot start.");
    browser.send(JSON.stringify({ type: "error", error: { message: "Server has no OPENAI_API_KEY. Set the env var and restart the server in that same terminal." } }));
    browser.close();
    return;
  }

  // Start recording this call (audio + transcript + structured data)
  const rec = newRecording();
  let finalized = false;
  const saveCall = async () => {
    if (finalized) return; finalized = true;
    try {
      const folder = await finalize(rec, SAFETY_NET, DATA_DIR);
      if (folder) console.log("💾 Call saved to " + folder);
    } catch (e) { console.error("✗ Could not save call:", e.message); }
  };

  // Open the upstream connection to OpenAI using the real key (server-side only)
  console.log(`→ Opening OpenAI Realtime (model: ${MODEL}) …`);
  const upstream = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(MODEL)}`,
    { headers: { Authorization: `Bearer ${KEY}` } }   // GA API: no OpenAI-Beta header
  );

  const queue = [];                       // buffer browser messages until upstream is open
  const flush = () => { while (queue.length) upstream.send(queue.shift()); };

  upstream.on("open", () => { console.log("✓ OpenAI connected. Relaying audio."); flush(); });

  upstream.on("message", (data) => {      // OpenAI -> browser
    const str = data.toString();
    if (browser.readyState === WebSocket.OPEN) browser.send(str);
    try { fromServer(rec, JSON.parse(str)); } catch {}
  });

  // OpenAI refused the handshake (e.g. 401 bad key, 403 no Realtime access, 404 bad model)
  upstream.on("unexpected-response", (_req, res) => {
    let body = "";
    res.on("data", (d) => (body += d));
    res.on("end", () => {
      const detail = `OpenAI rejected the connection: HTTP ${res.statusCode}. ${body.slice(0, 300)}`;
      console.error("✗ " + detail);
      if (browser.readyState === WebSocket.OPEN)
        browser.send(JSON.stringify({ type: "error", error: { message: detail } }));
      try { browser.close(); } catch {}
    });
  });

  upstream.on("close", (code, reason) => {
    const r = reason ? reason.toString() : "";
    console.log(`✗ OpenAI connection closed (code ${code}${r ? ", " + r : ""}).`);
    saveCall();
    try { browser.close(); } catch {}
  });

  upstream.on("error", (e) => {
    console.error("✗ Upstream error:", e.message);
    if (browser.readyState === WebSocket.OPEN)
      browser.send(JSON.stringify({ type: "error", error: { message: "Upstream error: " + e.message } }));
  });

  browser.on("message", (data) => {       // browser -> OpenAI
    const msg = data.toString();
    if (upstream.readyState === WebSocket.OPEN) upstream.send(msg);
    else queue.push(msg);
    try { fromClient(rec, JSON.parse(msg)); } catch {}
  });
  browser.on("close", () => { saveCall(); try { upstream.close(); } catch {} });
});

function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

await mkdir(DATA_DIR, { recursive: true });

server.listen(PORT, () => {
  console.log(`\n  Gyarah Das voice app → http://localhost:${PORT}`);
  console.log(`  Model: ${MODEL}  |  Voice: ${VOICE}  |  Mode: tokenless relay`);
  console.log(`  Calls saved to: ${DATA_DIR}`);
  if (!KEY) console.log("  ⚠  No OPENAI_API_KEY found in environment.\n");
  else      console.log("  ✓  API key loaded (stays on the server).\n");
});
