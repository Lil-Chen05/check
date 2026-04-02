# Check — Multiplayer Card Game (Beta)

Play Now: https://check-roan-kappa.vercel.app/

Guest play is live (beta). Better UI, a mobile app, and ranked play are coming soon.

A real-time multiplayer card game where 3–12 players compete to have the lowest point total through memory, strategy, and fast reactions.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.io
- **Database/Auth:** Supabase (optional for guest play; used for accounts + win tracking)

## Prerequisites
- Node.js 18+

Supabase is optional for guest play.

## Setup

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Supabase (optional)

Skip this step if you only want guest play (no account login / win tracking).

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration SQL in `supabase/migration.sql` via the Supabase SQL Editor
3. Copy your project credentials from Settings → API

### 3. Set environment variables

Create `.env` files from the example:

```bash
# In /server
cp ../.env.example .env
# Edit .env with your Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET)

# In /client
cp ../.env.example .env
# Edit .env with your Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SERVER_URL)
```

| Variable | Where | Description |
|---|---|---|
| `PORT` | Server | Server port (default 3001) |
| `SUPABASE_URL` | Server | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Server | Service role key (for server-side DB writes) |
| `SUPABASE_JWT_SECRET` | Server | JWT secret for verifying auth tokens |
| `VITE_SUPABASE_URL` | Client | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Anonymous/public key |
| `VITE_SERVER_URL` | Client | Backend URL (http://localhost:3001 for local dev) |

### 4. Run locally

```bash
# Terminal 1 — start the server
cd server && npm run dev

# Terminal 2 — start the client
cd client && npm run dev
```

Open http://localhost:5173 in multiple browser windows to test multiplayer.

## How to Play
1. Choose **Guest play** or **Sign up / log in** (Supabase is optional)
2. **Create a room** or join one with a 6-character code
3. Once 3–12 players have joined, the host starts the game
4. Each player receives 4 face-down cards and peeks at one
5. On your turn, draw a card then either play it or swap it with one of your cards
6. **React instantly** when a card hits the pile — if you have a matching card, slam it!
7. Call **Check** when you think you have the lowest score
8. Lowest total points wins

## Game Rules Summary

Full rules (exactly as implemented): [`docs/rules.md`](docs/rules.md)

| Card | Points |
|---|---|
| A–9 | Face value (1–9) |
| 10 | 0 |
| J, Q, K | 10 each |
| Joker | −1 |

**Power cards:** J (peek own card), Q (blind swap any two), Red K (add card to any hand), Black K (peek and swap any card)

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the simplest production setup.
