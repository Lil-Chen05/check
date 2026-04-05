# Deployment

Goal: deploy a fully working instance of Check with accounts, stat tracking, and the leaderboard.

This repo uses:

- A **Vite/React frontend** (static files) → deployed to Vercel
- A long-running **Node + Socket.io backend** (in-memory rooms) → deployed to Railway or Render
- **Supabase** for authentication, profiles, and stats

---

## 1) Supabase Setup

### Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Under **Settings → API**, copy:
   - **Project URL** → used as `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon / public key** → used as `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → used as `SUPABASE_SERVICE_KEY`
3. Under **Settings → JWT Settings**, copy the **JWT Secret** → used as `SUPABASE_JWT_SECRET`

### Run the schema SQL

In **SQL Editor → New Query**, paste and run:

```sql
-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  display_name text,
  games_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0
);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, games_played, wins, total_points)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', 'Player'), 0, 0, 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Atomic stats update RPC
CREATE OR REPLACE FUNCTION update_player_stats(
  p_user_id uuid, p_is_winner boolean, p_points integer
)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET
    games_played = games_played + 1,
    wins         = wins + CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    total_points = total_points + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles are publicly readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "users can update own profile"   ON profiles FOR UPDATE USING (auth.uid() = id);
```

### Configure redirect URLs

In **Authentication → URL Configuration**:
- **Site URL**: `https://your-frontend-domain.vercel.app`
- **Redirect URLs**: add `https://your-frontend-domain.vercel.app/**`

This is required for email confirmation links to work correctly.

---

## 2) Deploy the Backend (Railway or Render)

Pick a host that keeps the Node process running (WebSockets must stay connected).

### Backend environment variables

| Variable | Value |
|---|---|
| `PORT` | `3001` (or let the host assign it) |
| `CLIENT_URL` | Exact frontend origin, e.g. `https://check-roan-kappa.vercel.app` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key |
| `SUPABASE_JWT_SECRET` | JWT secret |

### Deploy checklist

1. Deploy from the `server/` directory.
2. Start command: `npm start`
3. Set all environment variables above.
4. Note the deployed backend URL (e.g. `https://check-production.up.railway.app`).

### Health check

`GET /health` → `{ status: "ok" }`

### Guest connections

Guests (no JWT token) are always accepted by the server regardless of whether `SUPABASE_JWT_SECRET` is set. Only their stats are not recorded.

---

## 3) Deploy the Frontend (Vercel)

### Frontend environment variables

Set these in Vercel under **Project Settings → Environment Variables** (all environments):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_SERVER_URL` | Your deployed backend URL |

### Deploy checklist

1. Connect the repository to Vercel.
2. Set **Root Directory** to `client/`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add all three environment variables above.
6. Deploy. SPA rewrites are already configured in `client/vercel.json`.

After changing environment variables, **redeploy** to pick them up (Deployments → Redeploy).

---

## 4) Local Development

### Server (`server/.env`)

```
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Client (`client/.env.local`)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SERVER_URL=http://localhost:3001
```

Note: Vite reads `.env.local` from the **`client/` directory**, not the repo root.

### Run both services

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Open http://localhost:5173 in multiple windows to test multiplayer.

---

## 5) End-to-End Test Checklist

1. Visit the frontend URL and **sign up** — confirm a profile row appears in Supabase.
2. Sign in on a second browser/device.
3. One player creates a Casual room, others join with the code.
4. Complete a game — confirm `games_played`, `wins`, and `total_points` updated in Supabase.
5. Check the **Leaderboard** on the dashboard.
6. Sign out — confirm the app returns to the auth page.
7. **Guest flow**: click "Play as Guest", create/join a room, complete a game — confirm no Supabase profile is created for the guest.

---

## Common Issues

| Symptom | Likely cause |
|---|---|
| "CORS blocked origin" | `CLIENT_URL` on the backend doesn't exactly match the frontend origin (check `https://`) |
| Leaderboard shows "unavailable" | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` not set in Vercel env vars |
| Sign-up works but no confirmation email | Supabase Site URL / Redirect URLs not configured |
| Stats not updating after games | `SUPABASE_SERVICE_KEY` or `SUPABASE_JWT_SECRET` not set on the backend |
