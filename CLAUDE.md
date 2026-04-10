# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Check** is a real-time multiplayer card game (3–12 players). Players aim for the lowest point total and can call "Check" to end the round. The game features a reaction mechanic where any player can react to a card played on the pile. Accounts are backed by Supabase; guest play is available without an account.

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

Both are separate projects — run each in its own terminal. No root-level package.json. No test runner is configured.

## Environment Setup

**`server/.env`** — server requires:
- `PORT` (default 3001)
- `CLIENT_URL` — deployed frontend origin for CORS
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` — for auth and stat writes

**`client/.env.local`** (must be in `client/` directory, not repo root) — client requires:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase public credentials
- `VITE_SERVER_URL` — backend URL

When `SUPABASE_JWT_SECRET` is unset, the socket auth middleware accepts all connections (dev mode). Guests (no token) are always accepted regardless of whether Supabase is configured.

## Architecture

### Client–Server Split
- **`client/`**: React 19 + Vite + Tailwind.
- **`server/`**: Express + Socket.io. Rooms and all game state are held in a single in-memory `rooms` Map. **No database for game state.**

### Routes

| Path | Page | Notes |
|---|---|---|
| `/` | `AuthPage` | Sign in / Sign up / Play as Guest |
| `/home` | `DashboardPage` | Mode select + embedded leaderboard |
| `/casual` | `CasualPage` | Create / join room |
| `/ranked` | `RankedPage` | Coming Soon (signed-in) or Sign In nudge (guest) |
| `/leaderboard` | `LeaderboardPage` | Top 10 by wins |
| `/lobby/:roomCode` | `LobbyPage` | Pre-game waiting room |
| `/game/:roomCode` | `GamePage` | Active game |
| `/rules` | `RulesPage` | How to Play — **no** `ProtectedRoute`, publicly accessible |

`ProtectedRoute` allows access if `user` (Supabase session) **or** `guestMode` (sessionStorage flag). Unauthenticated non-guest visitors are redirected to `/`.

### Auth & Guest Mode (`client/src/hooks/useAuth.jsx`)
- Manages Supabase session via `onAuthStateChange`.
- `guestMode` — boolean persisted in `sessionStorage`; set by `playAsGuest()`.
- `signOut()` clears both the Supabase session and `guestMode`/guest sessionStorage keys.
- `refreshProfile()` — re-fetches the `profiles` row for the current user.
- Exposes: `user`, `profile`, `guestMode`, `isConfigured`, `signIn`, `signUp`, `signOut`, `playAsGuest`, `getToken`, `refreshProfile`.

### Socket Auth (`server/middleware/auth.js`)
- **No token** → guest accepted; `socket.isGuest = true`, userId from handshake or random `guest-` ID.
- **Token present, no secret** → dev mode, all accepted.
- **Token present, secret set** → JWT verified; `socket.userId = payload.sub`.

### Socket Communication
- Client connects via `useSocket.js` using `VITE_SERVER_URL`.
- Authenticated users pass their JWT token in the Socket.io handshake `auth` object.
- Guests pass no token — server accepts them unconditionally.
- All gameplay events flow through socket handlers — clients never simulate game logic locally; they only render the server-filtered `game-state` they receive.

### Server Game Modules (`server/game/`)

| File | Responsibility |
|---|---|
| `Deck.js` | Deck creation, shuffling, power-card identification |
| `GameState.js` | Main state machine — phases, turn advancement, reaction window integration |
| `PowerCards.js` | J/Q/Red King/Black King power resolution |
| `Reactions.js` | Reaction window logic, penalty/success outcomes, one-attempt-per-player rule |
| `Scoring.js` | Point calculation — returns `{ id, displayName, points, ... }[]` sorted winner-first |

### Socket Handlers (`server/socket/`)

| File | Events handled |
|---|---|
| `roomHandlers.js` | create/join/leave rooms |
| `gameHandlers.js` | draw, play, swap, check, power resolution; `updateWinStats` on game over |
| `reactionHandlers.js` | reaction window open/close, react attempts |

### Stats Recording (`server/socket/gameHandlers.js`)
When a game ends, `updateWinStats(room, scores)` is called:
- Filters out guests (non-UUID player IDs via regex).
- Calls `supabase.rpc('update_player_stats', { p_user_id, p_is_winner, p_points })` per real player.
- `scores` is sorted winner-first; score field is `points` (from `Scoring.js`).
- Best-effort — errors are swallowed so a DB failure never breaks gameplay.

### Client Hooks (`client/src/hooks/`)

| File | Purpose |
|---|---|
| `useSocket.js` | Socket.io connection and event wiring |
| `useGameState.js` | Local mirror of server game state |
| `useAuth.jsx` | Supabase auth + guest mode context |
| `useCompactTableLayout.js` | Layout math for the game board |
| `useTableFeedback.js` | Visual feedback for table interactions |
| `useEventLog.js` | Builds human-readable event log from `gameState.lastEventFeedback` and `lastReactionResult`; entries expire after 5 s, max 4 shown |

### Client Utilities (`client/src/utils/`)
- **`cardUtils.js`** — `getPointValue`, `getCardLabel`, `getSuitSymbol`, `getSuitColor`, `isPowerCard`, `isRedSuit`. Single source of truth for card display and point values on the client.
- **`cardLayout.js`** — geometry helpers used by `useCompactTableLayout` for positioning cards on the game board.

### Notable Client Components (`client/src/components/`)
- **`Header.jsx`** — top nav with logo, profile display, sign out button
- **`EventLog.jsx`** — floating top-right log; pointer-events disabled so it never blocks interaction
- **`SwapArc.jsx`** — SVG arc connecting swapped card slots; reads `data-slot-player` / `data-slot-index` DOM attributes

### State Management Pattern
`useGameState` is the single source of truth — it subscribes directly to socket events and owns all game state. Child hooks (`useEventLog`, `useTableFeedback`) and components consume `gameState` as a prop and do **not** add their own socket listeners. `GameBoard` uses local optimistic state (`optimisticPowerSecond`, `optimisticDrawSlot`) for immediate visual feedback while awaiting the next `game-state` broadcast.

### Socket Patterns
All client→server events use acknowledgment callbacks: `callback?.({ success: true })` / `callback?.({ error: '...' })`.

Key client→server events: `draw-card`, `play-drawn-card`, `swap-card`, `peek-card`, `call-check`, `react-own-card`, `react-steal`, `resolve-power`, `return-to-lobby`.

Key server→client broadcasts: `game-state`, `reaction-window-open`, `reaction-window-closed`, `reaction-result`, `game-over`, `returned-to-lobby`.

**Shared constant**: `MAX_HAND_FOR_STEAL_REACT = 7` is defined in `server/game/Reactions.js` and must stay in sync with any client-side enforcement.

## Supabase Database

**`profiles` table** — one row per auth user:

| Column | Type | Description |
|---|---|---|
| `id` | uuid PK | Matches `auth.users.id` |
| `display_name` | text | Set from `raw_user_meta_data` on sign-up via trigger |
| `games_played` | int4 | Incremented after every completed game |
| `wins` | int4 | Incremented for the winner |
| `total_points` | int4 | Cumulative score (used to compute average: `total_points / games_played`) |

**RPC:** `update_player_stats(p_user_id, p_is_winner, p_points)` — atomically updates all three stat columns.

**RLS:** public SELECT (leaderboard), owner UPDATE from client. Server uses service key (bypasses RLS).

## Key Game Rules (for implementing features)

Full rules are in `docs/rules.md`. Critical implementation details:

- **Card values**: 1–9 = face value, 10 = 0, J/Q/K = 10, Joker = -1. **Lowest score wins.**
- **Kings are the only suit-sensitive card**: Red Kings (♥♦) and Black Kings (♠♣) are different ranks for all purposes including reactions.
- **Reactions**: When a card lands on the play pile, a ~2–3 second window opens. Any player gets exactly one attempt (own card or steal — not both). First successful reaction wins; subsequent correct reactions are penalized. Reactions cannot chain.
- **Failed steal**: the grabbed card is returned to the opponent's original hand position; the thief draws one penalty card. The thief does **not** keep the wrong card.
- **Steal mechanic (success)**: Successful steal → thief controls any power; thief gives one of their cards to victim. Max 7 cards per hand enforced on steal.
- **Check**: Called at start of turn before drawing. Caller takes a normal turn, then every other player takes one final turn, then scoring.

## Deployment

- **Frontend**: Vercel (deploy `client/` directory, build command `npm run build`, output `dist/`). SPA rewrites in `client/vercel.json`. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SERVER_URL` in Vercel env vars.
- **Backend**: Railway or Render (deploy `server/` directory, start command `npm start`). Set `CLIENT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`.
- **Supabase**: Set Site URL and Redirect URLs in Authentication → URL Configuration to the production frontend domain.
- Health check: `GET /health` → `{ status: "ok" }`.
