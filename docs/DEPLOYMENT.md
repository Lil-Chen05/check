# Deployment (Simplest Public Guest Beta)

Goal: let anyone visit your website and join the same multiplayer game using your room code.

This repo uses:

- A **Vite/React frontend** (static files)
- A long-running **Node + Socket.io backend** (in-memory rooms)

## 1) Deploy the backend (Node + Socket.io)

Pick a host that keeps your Node process running (so WebSockets stay connected), such as:

- Render
- Railway
- Fly.io

### Backend deploy checklist

1. Deploy from the `server/` directory.
2. Start command: `npm start` (from [`server/package.json`](../server/package.json)).
3. Set `CLIENT_URL` to the exact origin of your deployed frontend, for example:
   - `CLIENT_URL=https://check-roan-kappa.vercel.app`

   Your server uses this to allow browser origins for CORS (see [`server/index.js`](../server/index.js)).

4. **Guest mode:** do **not** configure JWT verification.
   - Leave `SUPABASE_JWT_SECRET` unset (or empty).
   - You can omit other Supabase vars as well.

When `SUPABASE_JWT_SECRET` is not set, the socket auth middleware accepts guest connections.

### Health check

Your server exposes `GET /health` returning `{ status: "ok" }`.

## 2) Deploy the frontend (Vercel)

Deploy the `client/` project to Vercel.

### Frontend deploy checklist

1. Project root: `client/`
2. Build command: `npm run build`
3. Output directory: `dist` (Vite default)
4. Set environment variable:
   - `VITE_SERVER_URL=https://<your-backend-host>`

   The client uses this to connect to Socket.io (see [`client/src/hooks/useSocket.js`](../client/src/hooks/useSocket.js)).

5. Supabase is optional:
   - You can omit `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for guest play.

### SPA routing

Your client has a Vercel rewrite config already in [`client/vercel.json`](../client/vercel.json) so routes like `/home`, `/lobby/:roomCode`, and `/game/:roomCode` work on refresh.

## 3) Test from different locations

1. Open your Vercel URL on one device, pick a guest name, and `Create Room`.
2. Open the same Vercel URL on a second device (or incognito window), and `Join Room` with the code.
3. Start the game from the host.
4. Confirm gameplay works end-to-end (draw, play, reactions, check, scoring).

If you see “CORS blocked origin” errors, your `CLIENT_URL` value on the backend does not exactly match the deployed frontend origin (including `https`).

## Why this works for Canada (and everywhere)

Every guest loads the same frontend URL, and every browser connects to the same backend WebSocket URL.

Because rooms and game state live in-memory inside the backend process, all players who connect to that same backend automatically join the same game instance.

