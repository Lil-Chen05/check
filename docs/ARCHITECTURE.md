# Architecture (High Level)

This project is split into two parts:

- `client/`: React + Vite UI
- `server/`: Node + Express + Socket.io real-time backend

Both use **Supabase** for authentication, user profiles, and stat tracking.

---

## Client (`client/`)

### Routes

| Path | Component | Access |
|---|---|---|
| `/` | `AuthPage` | Public — redirects to `/home` if already authenticated or in guest mode |
| `/home` | `DashboardPage` | Protected (user or guest) — mode select + embedded leaderboard |
| `/casual` | `CasualPage` | Protected — create or join a room |
| `/ranked` | `RankedPage` | Protected — "Coming Soon" (signed-in) or "Sign In" nudge (guest) |
| `/leaderboard` | `LeaderboardPage` | Protected — top 10 players by wins |
| `/lobby/:roomCode` | `LobbyPage` | Protected — pre-game waiting room |
| `/game/:roomCode` | `GamePage` | Protected — active game board |

### Auth & Guest Mode

- `AuthProvider` (`client/src/hooks/useAuth.jsx`) wraps the app and manages Supabase session state.
- Exposes `user`, `profile`, `guestMode`, `playAsGuest()`, `signIn()`, `signUp()`, `signOut()`, `getToken()`.
- `guestMode` is persisted in `sessionStorage`. When set, the `ProtectedRoute` allows access even without a Supabase session.
- `signOut()` clears `guestMode` and all guest `sessionStorage` keys.
- Supabase client is in `client/src/utils/supabaseClient.js` — returns `null` if env vars are absent.

### Socket Connection

- Created in `useSocket.js` using `VITE_SERVER_URL`.
- Authenticated users pass their JWT as the `token` in the Socket.io handshake.
- Guests pass no token — the server accepts them and assigns a `guest-` prefixed ID.
- All gameplay events flow through socket handlers — clients never simulate game logic locally.

---

## Server (`server/`)

### Auth Middleware (`server/middleware/auth.js`)

- **No token in handshake** → accepted as a guest; `socket.isGuest = true`, userId set from handshake or randomly generated.
- **Token present, `SUPABASE_JWT_SECRET` not set** → dev mode, all connections accepted.
- **Token present, secret set** → JWT verified via `jsonwebtoken`; `socket.userId = payload.sub`.

### In-Memory State

- Exposes an HTTP server plus Socket.io.
- Maintains a `rooms` Map in memory; each room holds a `GameState` instance.
- **No database is used for game state** — all rooms are lost on server restart.

### Socket Handlers (`server/socket/`)

| File | Events handled |
|---|---|
| `roomHandlers.js` | `create-room`, `join-room`, `leave-room` |
| `gameHandlers.js` | `draw-card`, `play-drawn-card`, `swap-card`, `peek-card`, `call-check`, `resolve-power`, `return-to-lobby` — also calls `updateWinStats` on game over |
| `reactionHandlers.js` | `react-own-card`, `react-steal` |

### Stats Recording (`server/socket/gameHandlers.js`)

When a game ends (`advanceTurn()` returns `gameOver: true`), `updateWinStats` is called:

1. Filters out guest players (non-UUID IDs).
2. Calls the `update_player_stats` Supabase RPC once per real player.
3. Passes `p_is_winner`, `p_points` — the RPC atomically increments `games_played`, `wins`, and `total_points` in the `profiles` table.
4. Errors are swallowed (best-effort — a disconnected server does not break gameplay).

---

## Game Rules Source of Truth (`server/game/`)

Gameplay rules are implemented exclusively server-side:

| File | Responsibility |
|---|---|
| `Deck.js` | Deck creation, shuffling, power-card identification |
| `GameState.js` | Main state machine — phases, turn advancement, reaction window integration |
| `PowerCards.js` | J/Q/Red King/Black King power resolution |
| `Reactions.js` | Reaction window logic, penalty/success outcomes, one-attempt-per-player rule |
| `Scoring.js` | Point calculation (`points` field) and tie-breakers — returns array sorted winner-first |

All clients trust the server; they do not simulate or validate game rules locally.

---

## Supabase (`profiles` table)

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key — matches `auth.users.id` |
| `display_name` | `text` | Set at sign-up via `raw_user_meta_data` trigger |
| `games_played` | `int4` | Incremented after every completed game |
| `wins` | `int4` | Incremented when the player wins |
| `total_points` | `int4` | Cumulative score across all games (used to compute average) |

A `handle_new_user` trigger auto-creates a profile row when a Supabase auth user is created.
RLS allows public `SELECT` (leaderboard) and owner-only `UPDATE` from the client.
The server uses the **service role key** which bypasses RLS.

---

## Client Hooks (`client/src/hooks/`)

| File | Purpose |
|---|---|
| `useSocket.js` | Socket.io connection and event wiring |
| `useGameState.js` | Local mirror of server game state |
| `useAuth.jsx` | Supabase auth + guest mode context |
| `useCompactTableLayout.js` | Layout math for the game board |
| `useTableFeedback.js` | Visual feedback for table interactions |
| `useEventLog.js` | Builds human-readable event log; entries expire after 5 s, max 4 shown |

### State Management Pattern

`useGameState` is the single source of truth for game state — it subscribes directly to socket events. Child hooks (`useEventLog`, `useTableFeedback`) and components consume `gameState` as a prop and do **not** add their own socket listeners. `GameBoard` uses local optimistic state (`optimisticPowerSecond`, `optimisticDrawSlot`) for immediate visual feedback while awaiting the next `game-state` broadcast.

### Notable Client Components (`client/src/components/`)

- **`Header.jsx`** — top nav with logo, user profile display, sign out button
- **`EventLog.jsx`** — floating top-right log of recent actions; pointer-events disabled
- **`SwapArc.jsx`** — SVG arc connecting swapped card slots; reads `data-slot-player` / `data-slot-index` DOM attributes

---

## Socket Event Reference

**Client → Server:** `draw-card`, `play-drawn-card`, `swap-card`, `peek-card`, `call-check`, `react-own-card`, `react-steal`, `resolve-power`, `return-to-lobby`

**Server → Client:** `game-state`, `reaction-window-open`, `reaction-window-closed`, `reaction-result`, `game-over`, `returned-to-lobby`

All client→server events use acknowledgment callbacks: `callback?.({ success: true })` / `callback?.({ error: '...' })`.

**Shared constant:** `MAX_HAND_FOR_STEAL_REACT = 7` is defined in `server/game/Reactions.js` and must stay in sync with any client-side enforcement.
