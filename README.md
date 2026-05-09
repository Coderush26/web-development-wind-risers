[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/qMg4I596)

# Strait of Hormuz Crisis — Fleet Command System

Real-time maritime fleet command system. 15 cargo ships transit the Strait of Hormuz while Command monitors, reroutes, and directs via a live operations dashboard.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8, Tailwind CSS v4, React Leaflet v5 |
| Backend | Node.js 22, Express 5, Mongoose 9 |
| Database | MongoDB Atlas (dev) / MongoDB 7 (Docker) |
| Real-time | Pusher — fleet channel at 1 Hz, alerts, directives, zones |
| AI/NLP | Groq SDK — llama3-8b-8192 for distress message extraction |
| Routing | A* on a 170×250 navigable water grid (0.05° resolution) |
| Weather | Open-Meteo API (no key required), 5-min cache |
| Map tiles | CartoDB Dark Matter (free, no key required) |

---

## Production Deployment — vircosa.com (Oracle Cloud + GitHub Actions)

Every push to `main` triggers the workflow in `.github/workflows/deploy.yml`.

### One-time server setup (SSH in once, never again)

```bash
# 1. Clone the repo on the server (if not already done)
cd /var/www
sudo git clone https://github.com/<your-org>/<repo>.git wind-risers
sudo chown -R $USER:$USER wind-risers

# 2. Install Node.js 22 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 globally
sudo npm install -g pm2
pm2 startup   # follow the printed command to enable startup on reboot

# 4. Enable HTTPS with certbot (after first successful deploy)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vircosa.com -d www.vircosa.com
```

### GitHub Secrets required

Add these in **Settings → Secrets → Actions** on your GitHub repo:

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Oracle server IP or hostname |
| `SERVER_USER` | SSH username (e.g. `ubuntu`) |
| `SERVER_SSH_KEY` | Private SSH key (contents of `~/.ssh/id_rsa`) |
| `SERVER_PORT` | SSH port (usually `22`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for JWT signing |
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_KEY` | Pusher key (also used as `VITE_PUSHER_KEY` at build time) |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | Pusher cluster (e.g. `ap2`) |
| `GROQ_API_KEY` | Groq API key |
| `EMAIL_USER` | Gmail address for auth emails |
| `EMAIL_PASS` | Gmail App Password |

### What the workflow does on every push

1. SSHs into the Oracle server
2. `git reset --hard origin/main` — pulls the latest code
3. Writes `server/.env` from GitHub Secrets (fully automated, no manual .env on server)
4. Runs `npm ci && VITE_PUSHER_KEY=... npm run build` — Vite bakes Pusher keys into the JS bundle
5. Copies `client/dist/` → `/var/www/html/` (nginx webroot)
6. Runs `npm ci --omit=dev` in `server/`
7. `pm2 restart wind-risers-backend` (or starts it fresh on first deploy)
8. Deploys `nginx/vircosa.conf` → `/etc/nginx/sites-available/coderush` and reloads nginx

---

## Quick Start — Docker

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose v2)
- Pusher account (free tier) — [pusher.com](https://pusher.com)
- Groq API key (free tier) — [console.groq.com](https://console.groq.com)

### 1. Create `.env` in the project root (one file for everything)

```bash
cp .env.example .env
# then fill in all values
```

Docker Compose auto-loads the root `.env` — it is the single source of truth for both the server container and the React client build. The `MONGO_URI` you set is only used for local dev; Docker Compose overrides it to the bundled MongoDB container automatically.

### 2. Run

```bash
docker compose up --build
```

### 3. Run

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:5000 |

> The compose file overrides `MONGO_URI` to use the bundled local MongoDB container — your Atlas URI in `server/.env` is only used for manual dev.

---

## Manual Start — Development

For local dev, the server reads from `server/.env`. You can either copy the root `.env` there or create it separately:

```bash
cp .env server/.env   # or fill server/.env manually
```

### Terminal 1 — Server

```bash
cd server
npm install
npm run dev
```

### Terminal 2 — Client

The Vite dev server reads `client/.env` for `VITE_*` keys:

```bash
echo "VITE_PUSHER_KEY=your_key\nVITE_PUSHER_CLUSTER=your_cluster" > client/.env
cd client
npm install
npm run dev
```

Client: **http://localhost:3000** — Vite proxies `/api` to port 5000.

---

## Demo Users (auto-seeded on first run)

| Role | Email | Password |
|------|-------|----------|
| Command | command@coderush.dev | Command@123 |
| Captain (MV-7 Gharial) | captain@coderush.dev | Captain@123 |

**MV-7 Gharial** starts with only 750 t fuel — it triggers `insufficient_fuel` within minutes, demonstrating the low-fuel alert flow.

---

## Architecture

```
Client (React + Vite :3000)
  ├── /dashboard  Command Dashboard — fleet map, zone drawing, alert panel, directive composer
  ├── /captain    Captain Dashboard — single-ship status, directive inbox, distress signal
  └── /playback   Playback View     — timeline scrubber over 2-hr snapshot history

Server (Express :5000)
  ├── REST API           /api/auth /ships /zones /alerts /distress /directives /history
  ├── Simulator (1 Hz)   advance positions · fuel burn · geofence/proximity checks
  ├── Snapshot Scheduler node-cron every 30s · 2-hr ring buffer (HistorySnapshot)
  └── Pusher Trigger     HTTP POST to Pusher cloud relay after each tick

Pusher (cloud relay — no stateful socket server needed)
  ├── fleet      → fleet_update (1 Hz)
  ├── alerts     → alert · alert_updated
  ├── zones      → zone_created · zone_updated · zone_deleted
  └── directives → directive · directive_update
```

---

## API Reference

### Auth `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register |
| POST | `/login` | — | Login, returns JWT |
| GET | `/me` | JWT | Current user |
| GET | `/verify-email/:token` | — | Email verification |
| POST | `/forgot-password` | — | Send reset link |
| POST | `/reset-password/:token` | — | Reset password |

### Ships `/api/ships`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | All 15 ships |
| GET | `/:id` | JWT | Single ship |

### Zones `/api/zones`
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | JWT | any | Active zones |
| POST | `/` | JWT | command | Create zone + trigger reroute |
| PUT | `/:id` | JWT | command | Update zone |
| DELETE | `/:id` | JWT | command | Deactivate zone |

### Alerts `/api/alerts`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | All alerts |
| PUT | `/:id/acknowledge` | JWT | Acknowledge |
| PUT | `/:id/resolve` | JWT | Resolve |

### Distress `/api/distress`
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | JWT | captain | Submit free-text → Groq NLP → Alert |

### Directives `/api/directives`
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | JWT | command | Issue directive |
| GET | `/mine` | JWT | captain | My pending directives |
| GET | `/ship/:shipId` | JWT | any | Ship's directive history |
| PUT | `/:id/respond` | JWT | captain | Accept or escalate |

### History `/api/history`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Snapshot index (id + capturedAt) |
| GET | `/:snapshotId` | JWT | Full snapshot (ships + alerts) |

---

## Routing Engine

A* on a **170 × 250 grid** (0.05° ≈ 5 km per cell) over the bounding box N30.5 S22.0 E60.0 W47.5.

- Navigable cells pre-computed from the 26-point Strait of Hormuz water polygon in `server/data/fleet.json`
- Active restricted zones are built into a blocked-cell set per route computation
- `snapToWater()` BFS snaps coastal port positions into the nearest navigable cell before pathfinding
- Paths are computed at startup for all ships and self-healed on the tick loop if exhausted

---

## Constants and Assumptions

| Constant | Value | Rationale |
|----------|-------|-----------|
| Simulator tick | 1 Hz | Spec requirement |
| Proximity threshold | 2 km | Spec explicit |
| Adverse weather: wind | > 15 m/s | Beaufort force 7+ |
| Adverse weather: wave | > 2.5 m | Significant wave height threshold |
| Adverse weather: precipitation | > 5 mm/hr | Heavy rain threshold |
| Fuel burn penalty (adverse weather) | +30% | Spec explicit |
| Snapshot interval | 30 s | Spec requirement |
| Snapshot retention | 2 hours | Spec requires 1 hr; 2 hr gives extra buffer |
| Routing grid resolution | 0.05° (~5 km) | Balances A* performance and path accuracy |
| Arrival radius | 0.5 km | Practical "close enough to port" threshold |
| Pusher payload | `currentPath` stripped | Keeps fleet_update under 10 KB Pusher limit |
| Weather API cache | 5 min at 0.5° resolution | Within Open-Meteo free tier rate limits |
| AI model | llama3-8b-8192 | Fast inference; temp=0.1 for deterministic JSON |
| Fuel capacity baseline | From fleet.json initial fuel | Ships carry 72 h of fuel at cruising speed |
