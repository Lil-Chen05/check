# Next Session: How to Play / Rules Page

## What to implement

A `/rules` page for the Check card game. Players access it via a "How to Play" link in the
Header (visible on every page) and a subtle "How to Play" link in the Lobby (before games start).
The page is unprotected — no login required to view it.

Use `/plugin frontend-design` when building `RulesPage.jsx`.

---

## Files to create / modify

| File | Action |
|---|---|
| `client/src/pages/RulesPage.jsx` | **Create** — new page |
| `client/src/App.jsx` | **Edit** — add unprotected `/rules` route |
| `client/src/components/Header.jsx` | **Edit** — add "How to Play" nav link |
| `client/src/pages/LobbyPage.jsx` | **Edit** — add "How to Play" link below action buttons |

---

## RulesPage.jsx — full spec

### Route & access
- Path: `/rules`
- **No `ProtectedRoute` wrapper** — anyone can view (logged in, guest, or not authenticated)

### Visual style — match existing theme exactly
- Background: `felt-bg` + `<div className="noise-overlay" aria-hidden="true" />`
- Layout: `<Header />` at top, then `max-w-2xl mx-auto px-4 py-10`
- Section containers: `panel` class (frosted glass, gold border)
- Headings: `font-display text-antique-gold-400 tracking-display`
- Body text: `text-antique-gold-600/60` — **no white text**
- Dividers: `gold-rule`
- Buttons: `btn-secondary`

### Page header
```
"How to Play"           ← font-display text-5xl text-antique-gold-400 animate-shimmer
"Check · A Game of Memory & Reaction"  ← text-xs uppercase tracking-widest text-antique-gold-700/45
```
Then a `gold-rule`.

### Back button
Small `btn-secondary` or text link: "← Dashboard" → `navigate('/home')`

---

### Section 1 — Objective
**Heading:** Objective

> Aim to have the **lowest total point value** when the game ends.

Card value table (styled as a simple bordered table or panel rows):

| Card | Points |
|---|---|
| 1–9 | Face value |
| 10 | 0 |
| J, Q, K | 10 |
| Joker | −1 |

---

### Section 2 — The Table
**Heading:** The Table

Three zones on the board:

- **Draw Pile** — the face-down stack in the centre. On your turn you draw from here.
- **Top Pile** — the face-up discard pile. The card on top is what reactions are matched against.
- **Holding** — your row of face-down cards. Positions are fixed — you cannot freely rearrange them. Any card added to your hand (Red King power or penalty) always arrives at the **far right**.

---

### Section 3 — Visual Cues  ← STANDALONE SECTION (user specifically requested this)
**Heading:** Visual Cues

- A **glowing card** means another player is currently selecting or peeking at it — pay attention to which card lights up.
- When a **swap** occurs (Queen or Black King power), an animation shows which two cards exchanged positions.

---

### Section 4 — Power Cards
**Heading:** Power Cards

Powers trigger whenever a power card lands on the play pile — by any means (normal play, swap, or stolen via reaction).

| Card | Power |
|---|---|
| **Jack (J)** | Peek at any one of your own face-down cards |
| **Queen (Q)** | Blindly swap any two face-down cards anywhere on the table |
| **Red King (♥♦)** | Draw a card from the deck and place it face-down at the far right of any player's hand |
| **Black King (♠♣)** | Peek at any face-down card on the table, then move it to a different position |

---

### Section 5 — Reactions
**Heading:** Reactions

When any card lands on the pile, a brief window opens. If you hold a card of the same rank, you can slam it onto the pile — or attempt to grab a matching card from an opponent's hand.

Rules:
- You get **exactly one attempt per card played** — attempting a steal or reacting with your own card uses your single shot. You cannot fail a steal and then try your own card.
- A **failed steal**: the card is returned to the opponent's original hand position and you draw a penalty card. You do **not** keep the wrong card.
- Players holding **7 or more cards** cannot attempt to steal from other players (they may still react with their own cards).
- Only the **first** successful reactor benefits — any later correct reactions are penalised.

---

### Section 6 — Resolving Powers
**Heading:** Resolving Powers

When a power card is played the game pauses and prompts the controlling player to **resolve** it — choosing which card to peek at, or which two cards to swap. Other players wait. Once resolved, the game continues normally.

---

### Section 7 — Calling Check
**Heading:** Calling Check

At the **start of your turn**, before drawing, you may call **"Check"** if you believe you have the lowest score.

1. You still take a full normal turn after calling it.
2. Then every other player takes **one final turn** in order.
3. Hands are revealed and scores tallied.
4. Lowest total wins. Tiebreaker: fewest cards → closest to caller in turn order.

---

### Section 8 — Full Rules (footer / closing)

Closing line at bottom of the page (outside the last panel, centred):

> For a complete rule reference, see the
> [full rules on GitHub](https://github.com/Lil-Chen05/check/blob/main/docs/rules.md)

Render as an `<a href="..." target="_blank" rel="noopener noreferrer">` styled with `btn-secondary` or as a gold underline text link.

---

## App.jsx changes

Add import and unprotected route:

```jsx
import RulesPage from './pages/RulesPage';

// Inside <Routes>, before the * catch-all:
<Route path="/rules" element={<RulesPage />} />
```

No `ProtectedRoute` wrapper.

---

## Header.jsx changes

Current header has: `[Check logo button]` on left, `[profile + Sign Out]` on right.

Add a "How to Play" text link inside the right-side `<div className="flex items-center gap-4">`,
**before** the profile block so it appears left of it:

```jsx
<button
  onClick={() => navigate('/rules')}
  className="text-sm text-antique-gold-700/55 hover:text-antique-gold-400 transition-colors"
>
  How to Play
</button>
```

---

## LobbyPage.jsx changes

After the closing `</div>` of the action buttons row (`flex gap-3` with Leave / Start Game),
and after the "Waiting for host..." paragraph, add:

```jsx
<div className="text-center mt-3">
  <button
    onClick={() => navigate('/rules')}
    className="text-xs text-antique-gold-700/40 hover:text-antique-gold-600/65 transition-colors underline"
  >
    How to Play
  </button>
</div>
```

---

## Verification checklist

1. Visit `/rules` directly while logged out — page loads without redirect
2. "How to Play" in Header navigates to `/rules` from any page
3. "How to Play" in Lobby navigates to `/rules`
4. All 7 sections render with correct gold text (no white text)
5. GitHub link opens in a new tab
6. Back/Dashboard button returns to `/home`
7. Mobile: single column, readable, no overflow
8. Visual Cues is its own standalone panel section (not embedded in The Table)
