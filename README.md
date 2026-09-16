# EpochForge

<p align="center">
  <strong>The Collaborative, Animated High-Performance Timeline Platform</strong><br>
  Built with SvelteKit (Svelte 5 Runes), Yjs CRDTs, Hocuspocus WebSockets, PostgreSQL, and Drizzle ORM.
</p>

---

## ✨ Features

- ⚡ **Svelte 5 Runes & High Performance**: Zero Virtual-DOM overhead rendering of thousands of events and continuous multi-century timelines.
- 🎨 **Multi-View Engine**:
  - **Horizontal Band (Default)**: Continuous panning, mouse-wheel zooming, adaptive tick intervals, and sticky boundary badges on epoch edges.
  - **Vertical Story Feed**: Chronological cards with rich descriptions, covers, and dates.
  - **Gantt / Compact Grid**: Multi-track compact view for parallel epochs and project schedules.
- 🔄 **Real-Time Collaboration (Yjs & Hocuspocus)**:
  - Conflict-free collaborative editing powered by CRDTs.
  - Live awareness: Multi-user cursors, presence avatars, and live selection indicators.
  - Global Undo / Redo (`Ctrl+Z` / `Ctrl+Y`).
- 🏛️ **Deep BCE & Historical Date Support**: Seamless navigation from pre-history (negative astronomical years, e.g. `-500 BCE`) to modern days.
- 🔒 **Super-Admin & Dynamic Auth Providers**:
  - First-Run Wizard (`/setup`) automatically grants the first account the Super-Admin role and permanently locks itself.
  - Dynamic Social Logins (Google, GitHub, Discord, OIDC) configurable via `/admin/settings` (encrypted with AES-256-GCM in the DB).
  - Social buttons appear on the login screen **only when enabled and configured**.
  - One-click copy for OAuth callback/redirect URLs.
- 🤖 **Integrated Model Context Protocol (MCP) Server**:
  - AI agents can explore, create, update, and delete events via JSON-RPC / SSE at `/api/mcp`.
  - Granular API tokens (`timeline:read`, `timeline:write`, `timeline:audit`).
  - Agent modifications are automatically tagged with `[Agent/MCP]` in the immutable audit log.
- 📦 **Docker & Coolify Ready**:
  - Traefik routing with automatic Let's Encrypt HTTPS and WebSocket upgrades.
  - Persistent PostgreSQL 16 volume and `/app/uploads` media volume.

---

## 🚀 Quick Start (Docker Compose)

1. Clone the repository:
   ```bash
   git clone https://github.com/MarkenJaden/EpochForge.git
   cd EpochForge
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Launch services:
   ```bash
   docker compose up -d
   ```

4. Open your browser at `http://localhost:3000`. You will be greeted by the First-Run Setup Wizard to create your Super-Admin account!

---

## 🛠️ Local Development

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Run development server (with Hocuspocus WebSocket co-located):
   ```bash
   npm run dev
   ```

3. Build production bundle:
   ```bash
   npm run build
   npm start
   ```

---

## 📋 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/epochforge` |
| `BETTER_AUTH_SECRET` | Secret key for Better-Auth sessions | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | 32-byte key for AES-256-GCM DB secret encryption | `32-character-secret-key-phrase-` |
| `PORT` | Web server port | `3000` |
| `ORIGIN` | Public domain origin | `https://epochforge.example.com` |

---

## 🤖 MCP Server Tools

External AI agents connecting to `/api/mcp` with an authorized Bearer token can invoke:

- `list_timelines`: View all accessible timelines.
- `get_timeline_events`: Retrieve all events and spans for a given timeline ID.
- `create_event`: Create an event or epoch span with automatic `[Agent/MCP]` audit logging.
- `update_event`: Modify attributes of an existing event.
- `delete_event`: Remove an event from a timeline.

---

## 📜 License

MIT License © 2026 MarkenJaden & EpochForge Contributors.
