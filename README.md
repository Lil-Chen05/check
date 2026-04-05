# Check — Multiplayer Card Game

Play Now: https://check-roan-kappa.vercel.app/

A real-time multiplayer card game where 3–12 players compete to have the lowest point total through memory, strategy, and fast reactions. Sign in to track your stats and appear on the leaderboard, or jump straight in as a guest.

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Socket.io
- **Auth / Database:** Supabase (accounts, profiles, stats, leaderboard)

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

## Setup

### 1. Clone and install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Supabase — create the schema

In your Supabase project go to **SQL Editor → New Query** and run the SQL from the deployment guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) (Section 1).

### 3. Set environment variables

**`server/.env`**
```
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

**`client/.env.local`** (note: must be in the `client/` directory)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:3001
```

| Variable | Where | Description |
|---|---|---|
| `PORT` | Server | Server port (default 3001) |
| `CLIENT_URL` | Server | Frontend origin for CORS |
| `SUPABASE_URL` | Server | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Server | Service role key (server-side DB writes) |
| `SUPABASE_JWT_SECRET` | Server | JWT secret for verifying auth tokens |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Anonymous/public key |
| `VITE_SERVER_URL` | Client | Backend URL |

### 4. Run locally

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

Open http://localhost:5173 in multiple browser windows to test multiplayer.

## How to Play

1. **Sign in / sign up** to track stats and appear on the leaderboard, or click **Play as Guest**
2. Choose **Casual** from the dashboard
3. **Create a room** or join one with a 6-character code
4. Once 3–12 players have joined, the host starts the game
5. Each player receives 4 face-down cards and peeks at one privately
6. On your turn: draw from the deck **or take the play-pile top**, then play or swap
7. **React instantly** when a card hits the pile — if you hold a matching card, slam it!
8. Call **Check** when you think you have the lowest score
9. Lowest total points wins

## Game Rules Summary

Full rules: [`docs/rules.md`](docs/rules.md)

| Card | Points |
|---|---|
| A–9 | Face value (1–9) |
| 10 | 0 |
| J, Q, K | 10 each |
| Joker | −1 |

**Power cards:** J (peek own card) · Q (blind swap any two) · Red K (add card to any hand) · Black K (peek and swap any card)

**Failed steal:** the grabbed card is returned to the opponent's hand and the thief draws one penalty card — they do **not** keep the wrong card.

## Stats & Leaderboard

- Signed-in players have **wins**, **games played**, and **total points** recorded after every game (casual and ranked).
- The dashboard shows a live top-10 leaderboard ranked by wins.
- Guests can play freely but are not tracked and do not appear on the leaderboard.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full production setup guide.
