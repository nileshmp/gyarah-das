# Gyarah Das

A voice-based onboarding companion powered by the OpenAI Realtime API. The browser connects to a local relay server which holds your API key — your key never leaves the server process.

---

## Software Requirements

| Software | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 20.6+ | Runs the relay server |
| **npm** | 9+ (bundled with Node.js) | Installs dependencies |
| **Modern browser** | Chrome 94+, Edge 94+, Firefox 113+, Safari 17+ | Microphone + WebSocket support |
| **OpenAI API key** | — | Must have Realtime API access enabled |

---

## Installation

### macOS

1. **Install Node.js** (via [nvm](https://github.com/nvm-sh/nvm) — recommended):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   source ~/.zshrc          # or ~/.bashrc if using bash
   nvm install 20
   nvm use 20
   node --version           # should print v20.x.x
   ```
   Or download the macOS installer directly from https://nodejs.org (choose LTS ≥ 20).

2. **Clone the repo and install dependencies:**
   ```bash
   git clone <repo-url>
   cd gyarah-das
   npm install
   ```

3. **Set your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=sk-..." > .env
   ```

---

### Linux (Ubuntu/Debian)

1. **Install Node.js** via NodeSource:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node --version           # should print v20.x.x
   ```
   Or use nvm (same command as macOS above).

2. **Clone the repo and install dependencies:**
   ```bash
   git clone <repo-url>
   cd gyarah-das
   npm install
   ```

3. **Set your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=sk-..." > .env
   ```

   > **Microphone note:** If running in a headless/server environment, the browser frontend still needs a machine with a mic. The Node.js server itself does not capture audio.

---

### Linux (Fedora/RHEL/CentOS)

1. **Install Node.js** via NodeSource:
   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo dnf install -y nodejs        # or: sudo yum install -y nodejs
   node --version
   ```

2. **Clone the repo and install dependencies:**
   ```bash
   git clone <repo-url>
   cd gyarah-das
   npm install
   ```

3. **Set your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=sk-..." > .env
   ```

---

### Windows

1. **Install Node.js:**
   - Download the Windows installer (`.msi`) from https://nodejs.org — choose LTS ≥ 20.
   - Run the installer, keep all defaults (npm is included).
   - Open a new **Command Prompt** or **PowerShell** and verify:
     ```cmd
     node --version
     npm --version
     ```

   Or install via **winget**:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

2. **Clone the repo and install dependencies:**
   ```cmd
   git clone <repo-url>
   cd gyarah-das
   npm install
   ```
   > If you don't have git, download it from https://git-scm.com or install via `winget install Git.Git`.

3. **Set your OpenAI API key** — create a `.env` file in the project root:
   ```
   OPENAI_API_KEY=sk-...
   ```
   In PowerShell you can run:
   ```powershell
   "OPENAI_API_KEY=sk-..." | Out-File -Encoding utf8 .env
   ```

---

## Running the App

### Step 1 — Start the server

```bash
npm start
```

You should see output like:

```
  Gyarah Das voice app → http://localhost:3000
  Model: gpt-realtime  |  Voice: marin  |  Mode: tokenless relay
  ✓  API key loaded (stays on the server).
```

Keep this terminal open — the server must stay running while you use the app.

### Step 2 — Open the app in a browser

Open **http://localhost:3000** in a browser. The server serves `public/index.html` at this URL.

> **Do not open `index.html` directly** (e.g. by double-clicking the file). The app requires a live WebSocket connection to the server — opening the file directly (`file://...`) will break that connection and the app will not work.

Grant microphone access when the browser prompts, then start talking.

### Changing the port

```bash
PORT=8080 npm start          # macOS / Linux
set PORT=8080 && npm start   # Windows CMD
$env:PORT=8080; npm start    # Windows PowerShell
```

---

## Accessing from a Remote Machine

The server runs over plain HTTP on `localhost`. Browsers block microphone access on non-`localhost` HTTP origins, so you cannot simply open `http://remote-ip:3000` — the mic will be silently denied.

Use one of these approaches:

### Option A — SSH tunnel (recommended, no extra software)

Run this on your **local machine**, replacing `user` and `remote-host`:

```bash
ssh -L 3000:localhost:3000 user@remote-host
```

Then open **http://localhost:3000** in your local browser. The tunnel forwards your local port 3000 to the server's port 3000 — the browser sees it as `localhost` and allows the microphone.

Leave the SSH session open while using the app.

To use a different local port (e.g. if port 3000 is already taken locally):
```bash
ssh -L 8080:localhost:3000 user@remote-host
# then open http://localhost:8080
```

### Option B — ngrok (quick HTTPS tunnel, no server config needed)

On the **remote machine** where the Node server is running:

```bash
# Install ngrok (one time)
# Linux:
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# macOS:
brew install ngrok

# Then start the tunnel (after npm start is already running):
ngrok http 3000
```

ngrok will print a public `https://...ngrok-free.app` URL. Open that URL in any browser — HTTPS is handled automatically, so the microphone will work.

> Free ngrok accounts have a session time limit. For persistent use, see Option C.

### Option C — HTTPS with Nginx + Let's Encrypt (production)

If the remote machine has a public domain name, set up Nginx as a reverse proxy with a free SSL certificate:

```bash
sudo apt install nginx certbot python3-certbot-nginx  # Ubuntu/Debian

# Create /etc/nginx/sites-available/gyarah-das:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

sudo ln -s /etc/nginx/sites-available/gyarah-das /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

After this, open `https://your-domain.com` — microphone access will work over HTTPS.

---

## Build / Deploy (Production)

This is a plain Node.js process with no build step. For production:

1. **Set environment variables** on the server (`OPENAI_API_KEY`, optionally `PORT`).
2. **Install production dependencies only:**
   ```bash
   npm install --omit=dev
   ```
3. **Run with a process manager** (keeps it alive after crashes/reboots):

   **pm2 (all platforms):**
   ```bash
   npm install -g pm2
   pm2 start server.js --name gyarah-das
   pm2 save
   pm2 startup          # follow the printed command to enable on boot
   ```

   **systemd (Linux):** create `/etc/systemd/system/gyarah-das.service`:
   ```ini
   [Unit]
   Description=Gyarah Das voice relay
   After=network.target

   [Service]
   WorkingDirectory=/path/to/gyarah-das
   ExecStart=/usr/bin/node server.js
   Restart=on-failure
   Environment=OPENAI_API_KEY=sk-...
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```
   Then:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now gyarah-das
   ```

4. **Reverse proxy** (optional, for HTTPS): put Nginx or Caddy in front of the Node.js process. HTTPS is required in production for browser microphone access.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** Your OpenAI secret key. |
| `PORT` | `3000` | Port the HTTP/WebSocket server listens on. |
| `REALTIME_MODEL` | `gpt-realtime` | OpenAI Realtime model to use. |
| `REALTIME_VOICE` | `marin` | Voice for audio responses. |

These can be placed in a `.env` file in the project root — the server loads it automatically.

---

## Data

Call recordings (audio + transcripts) are saved to the `data/` folder in the project root. Each call gets its own subfolder. This folder is not tracked by git.
