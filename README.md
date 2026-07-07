VoxelForge
A self-hosted, browser-based Minecraft clone. Built with Three.js, Node.js, SQLite,and Docker. Runs on any ARM64/AMD64 home server (CasaOS, Umbrel, Synology, raw Linux).

Features
Infinite terrain with Simplex noise — Plains, Desert, Forest, Mountains biomes.
Greedy meshing for high-performance chunk rendering (60fps on integrated GPUs).
Creative & Survival modes with instant breaking / mining times.
LAN multiplayer via Socket.io — see other players on your network.
Per-user worlds with JWT auth, guest accounts, persistent chunk storage.
Procedural textures — no external assets, 16x16 atlas generated at runtime.
Pointer-lock FPS controls — WASD, jump, sneak, fly (double-tap Space).
One-command deploy — docker compose up -d.
Quick Start (Docker)
git clone https://github.com/voxelforge/voxelforge.gitcd voxelforgecp .env.example .env# Edit .env and set a strong JWT_SECRET!docker compose up -d --build
Open http://localhost:3000.

Local Development
bash

# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
Frontend runs at http://localhost:5173 and proxies API calls to http://localhost:3000.

CasaOS Installation
Open your CasaOS dashboard.
Go to the App Store → Custom Install (or use the official listing once published).
Use the manifest in deployment/casaos/casaos-app.json.
Map port 3000 and volume /DATA/AppData/voxelforge → /app/data.
Set JWT_SECRET to a strong random string.
Install and open http://casaos.local:3000.
Umbrel Installation
Copy deployment/umbrel/umbrel-app.yml to your Umbrel's app directory
(~/umbrel/apps/voxelforge/).
Run umbrel app install voxelforge from the Umbrel CLI, or use the App Store GUI.
Access at http://umbrel.local:3000.
Synology DSM Installation
Open Container Manager (Docker).
Create a new project from docker-compose.synology.yml.
Set PGID and PUID to your Synology user's IDs (typically 1000:1000).
Map volume ./voxelforge-data:/app/data.
Start the container and access http://<synology-ip>:3000.
Default Controls
Key
Action
W A S D	Move
Space	Jump / Fly up
Shift	Sneak / Fly down
Double-tap Space	Toggle flight (Creative)
Left Click	Break block
Right Click	Place block
1-9	Select hotbar slot
Scroll	Cycle hotbar
E	Open inventory
F	Toggle fullscreen
Esc	Release mouse

Architecture
text

Browser (Three.js)  ──HTTP/WS──▶  Node.js (Express + Socket.io)
                                       │
                                       ├── SQLite (users, worlds, state)
                                       └── Disk (.chunk files, gzipped)
Frontend: Vanilla JS + Three.js. Vite for dev/build. Greedy meshing, frustum
culling, procedural texture atlas.
Backend: Express REST API + Socket.io for real-time block sync. SQLite via
better-sqlite3 for accounts and metadata; chunks persisted as gzipped binary
files with an LRU cache.
Docker: Multi-stage build — frontend compiled in stage 1, backend runtime
in stage 3. Single image, single port, single volume.
Security
HTTP-only JWT cookies.
bcrypt password hashing (12 rounds).
Helmet.js secure headers.
Rate limiting on auth endpoints.
Input sanitization via express-validator + xss.
Parameterized SQL queries (no string interpolation).
License
MIT — see LICENSE.

Contributing
See CONTRIBUTING.md.

