# AI Teach Me Lava Lamps

![Demo](./demo.gif)

## Overview

This project is a lava-lamp-inspired demo built with Next.js, React Three Fiber, and Cloudflare services.

It is not a Navier-Stokes solver and it is not a production randomness system. The simulation is a simplified blob-based model designed for stable visuals, bounded runtime control, and an explorable entropy demo.

The app combines:

- A simplified lava-lamp simulation with bounded runtime parameters
- A Three.js room scene with one or more lamp instances
- A frame-capture entropy workflow based on rendered output
- An authenticated AI chat layer that can explain the system and trigger approved actions

## What The Code Actually Does

### Simulation

The physics core models lava as a set of blobs with:

- position
- velocity
- temperature
- influence radius
- strength
- mass

Each step applies:

- temperature evolution
- buoyancy
- gravity
- drag
- soft boundary response

The simulator uses a fixed timestep and semi-implicit Euler integration, then rebuilds a scalar field that is rendered through Marching Cubes.

This is a visually driven approximation, not research-grade fluid dynamics.

### Entropy Workflow

The entropy pipeline captures rendered lamp frames from the canvas, transfers them to a worker as an `ImageBitmap`, resizes the image, extracts RGBA bytes, mixes in timing noise plus demo external entropy bytes, and hashes the pool with SHA-256.

For multi-frame captures, the per-frame pools are concatenated and hashed again.

This is a demo entropy workflow only. It should not be treated as a standalone secure source of randomness.

### Agent Layer

The chat layer is authenticated and bounded. It can:

- explain the simulation
- explain entropy output
- adjust approved simulation parameters
- trigger entropy capture

The current parameter surface is intentionally small:

- `buoyancy`
- `damping`
- `diffusion`
- `temperature`

## Stack

- Next.js App Router
- React
- Three.js
- React Three Fiber
- Marching Cubes
- LangGraph (using `@langchain/cloudflare` + custom tool calling code)
- Cloudflare Workers AI
- Cloudflare Vectorize
- Cloudflare D1
- JWT-based auth
- bcrypt 
- react-katex (for agent math notation rendering)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the required values.

Required in the current implementation:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_D1_API_TOKEN`
- `AUTH_JWT_SECRET`
- `CLOUDFLARE_VECTORIZE_MEMORY_INDEX`

Optional:

- `CLOUDFLARE_API_TOKEN`
  If unset, the app falls back to `CLOUDFLARE_D1_API_TOKEN` for Cloudflare API access.
- `D1_AUTH_USERS_TABLE`
  Defaults to `users`.
- `CLOUDFLARE_AI_MODEL`

### 3. Create the D1 tables

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quotas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  quota INTEGER NOT NULL DEFAULT 0,
  max_quota INTEGER NOT NULL DEFAULT 100,
  reset_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### 4. Create the Vectorize memory index

Example with Wrangler:

```bash
wrangler vectorize create <YOUR_MEMORY_INDEX> --dimensions=768 --metric=cosine
```

### 5. Run the app

```bash
bun run dev
```

Then open `http://localhost:3000`.

## Available Scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
```

## App Flow

1. Users sign up or sign in.
2. The `/simulation` route is protected by session auth.
3. The room scene renders one or more lamp instances.
4. Each lamp runs the simplified blob simulation and renders its liquid surface through Marching Cubes.
5. The chat layer can explain the system or issue bounded client-side actions.
6. Entropy capture can be triggered manually or from chat, then summarized back into the UI.

## Important Notes

- This repo is a demo, not a hardened security product.
- The simulation is intentionally simplified for stability and control.
- The entropy output is illustrative and should not be marketed as production cryptography.
- Some internal repository rules and prompt logs live under `vibe/`, especially:
  - `vibe/CODING_RULES.MD`
  - `vibe/PLAN.MD`
  - `vibe/PROMPTS.MD`

## Credits

- Lava lamp model: [Sketchfab - Lava Lamp](https://sketchfab.com/3d-models/lava-lamp-e8c41a8bdce84b599dd4d83293cbff6d)

## Author

[Med](https://www.yassinehemissi.me/)
