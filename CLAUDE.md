# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Check** is a real-time multiplayer card game (3–12 players). Players aim for the lowest point total and can call "Check" to end the round. The game features a reaction mechanic where any player can react to a card played on the pile.

## Development Commands

### Server (`server/`)
```bash
npm run dev    # Run with file watching (node --watch)
npm start      # Production start
```

### Client (`client/`)
```bash
npm run dev    # Vite dev server (http://localhost:5173)
npm run build  # Production build → dist/
npm run preview # Preview production build (http://localhost:4173)
```

Both are separate projects — run each in its own terminal. No root-level package.json. No test runner is configured — neither client nor server has test scripts.

## Environment Setup

Copy `.env.example` to `server/.env`. The server requires:
- `PORT` (default 3001)
- `CLIENT_URL` — deployed frontend origin for CORS

Supabase vars are optional. When `SUPABASE_JWT_SECRET` is unset, the socket auth middleware accepts guest connections. Client needs `VITE_SERVER_URL` pointing to the backend.

## Architecture

### Client–Server Split
- **`client/`**: React 19 + Vite + Tailwind. Routes: `/home`, `/lobby/:roomCode`, `/game/:roomCode`.
- **`server/`**: Express + Socket.io. Rooms and all game state are held in a single in-memory `rooms` Map. **No database for game state.**

### Socket Communication
- Client connects via `useSocket.js` using `VITE_SERVER_URL`.
- Socket auth middleware (`server/middleware/auth.js`) validates JWT if Supabase is configured, otherwise accepts guests.
- All gameplay events flow through socket handlers — clients never simulate game logic locally; they only render the server-filtered `game-state` they receive.

### Server Game Modules (`server/game/`)
The game rules are implemented exclusively server-side:

| File | Responsibility |
|---|---|
| `Deck.js` | Deck creation, shuffling, power-card identification |
| `GameState.js` | Main state machine — phases, turn advancement, reaction window integration |
| `PowerCards.js` | J/Q/Red King/Black King power resolution |
| `Reactions.js` | Reaction window logic, penalty/success outcomes, one-attempt-per-player rule |
| `Scoring.js` | Point calculation and tie-breakers |

### Socket Handlers (`server/socket/`)
| File | Events handled |
|---|---|
| `roomHandlers.js` | create/join/leave rooms |
| `gameHandlers.js` | draw, play, swap, check, power resolution |
| `reactionHandlers.js` | reaction window open/close, react attempts |

### Client Hooks (`client/src/hooks/`)
| File | Purpose |
|---|---|
| `useSocket.js` | Socket.io connection and event wiring |
| `useGameState.js` | Local mirror of server game state |
| `useAuth.jsx` | Supabase auth (optional; guest play works without it) |
| `useCompactTableLayout.js` | Layout math for the game board |
| `useTableFeedback.js` | Visual feedback for table interactions |
| `useEventLog.js` | Builds human-readable event log from `gameState.lastEventFeedback` and `lastReactionResult`; entries expire after 5 s, max 4 shown |

### Notable Client Components (`client/src/components/`)
- **`EventLog.jsx`** — floating top-right log of recent actions; receives `entries[]` from `useEventLog`; pointer-events disabled so it never blocks interaction
- **`SwapArc.jsx`** — SVG arc connecting two card slots after a Queen/Black-King swap; reads card positions from `data-slot-player` / `data-slot-index` DOM attributes

### State Management Pattern
`useGameState` is the single source of truth — it subscribes directly to socket events and owns all game state. Child hooks (`useEventLog`, `useTableFeedback`) and components consume `gameState` as a prop and do **not** add their own socket listeners. `GameBoard` uses local optimistic state (`optimisticPowerSecond`, `optimisticDrawSlot`) for immediate visual feedback while awaiting the next `game-state` broadcast.

### Socket Patterns
All client→server events use acknowledgment callbacks: `callback?.({ success: true })` / `callback?.({ error: '...' })`.

Key client→server events: `draw-card`, `play-drawn-card`, `swap-card`, `peek-card`, `call-check`, `react-own-card`, `react-steal`, `resolve-power`, `return-to-lobby`.

Key server→client broadcasts: `game-state`, `reaction-window-open`, `reaction-window-closed`, `reaction-result`, `game-over`, `returned-to-lobby`.

**Shared constant**: `MAX_HAND_FOR_STEAL_REACT = 7` is defined in `server/game/Reactions.js` and must stay in sync with any client-side enforcement.

## Key Game Rules (for implementing features)

Full rules are in `docs/rules.md`. Critical implementation details:

- **Card values**: 1–9 = face value, 10 = 0, J/Q/K = 10, Joker = -1. **Lowest score wins.**
- **Kings are the only suit-sensitive card**: Red Kings (♥♦) and Black Kings (♠♣) are different ranks for all purposes including reactions.
- **Reactions**: When a card lands on the play pile, a ~2–3 second window opens. Any player gets exactly one attempt (own card or steal — not both). First successful reaction wins; subsequent correct reactions are penalized. Reactions cannot chain.
- **Steal mechanic**: Successful steal → thief controls any power; thief gives one of their cards to victim. Max 7 cards per hand enforced on steal.
- **Check**: Called at start of turn before drawing. Caller takes a normal turn, then every other player takes one final turn, then scoring.

## Deployment

- **Frontend**: Vercel (deploy `client/` directory, build command `npm run build`, output `dist/`). SPA rewrites are configured in `client/vercel.json`.
- **Backend**: Railway or Render (deploy `server/` directory, start command `npm start`). Must set `CLIENT_URL` to exact frontend origin to avoid CORS errors.
- Health check: `GET /health` → `{ status: "ok" }`.
