# Full Game Rules (Exact)

These rules are the authoritative specification for gameplay. The implemented server logic is expected to follow them exactly.

## Players & Decks

1. **3–6 players** use **one deck** (including both Jokers).
2. **7–12 players** use **two decks** (including both Jokers).

## Card Point Values

| Card | Points |
|---|---:|
| **1–9** | Face value (1 through 9) |
| **10** | 0 |
| **J, Q, K** | 10 each |
| **Joker** | -1 |

**Goal:** have the **lowest** total point value when the game ends.

## Setup

1. Shuffle the deck(s) including Jokers.
2. Deal each player **exactly 4 cards** face-down in a row.
3. Each player privately peeks at **exactly one** of their own cards (they choose which). After peeking, it goes back face-down and they **cannot freely look again**.
4. Players cannot rearrange their cards freely — positions are fixed unless moved by a game mechanic.
5. Flip the top card of the draw deck to start the play pile.
   - If this card is a **power card** (J, Q, or any King), reshuffle it and draw again until a non-power card starts the pile.
   - The power is **NOT** triggered by this flip.

## Turn Structure

1. The active player must **acquire** one face-up card to hold for this turn, either:
   - **Draw** the top card from the draw deck (shown only to them), or
   - **Take** the current top card from the play pile (already visible to everyone). They must have at least one hand card to swap afterward.
2. Then:
   - If they **drew** from the deck, they may either **play that card** onto the play pile (triggering its power if any) **or** **swap** it with one of their face-down hand cards (the displaced card is played onto the pile and may trigger powers).
   - If they **took** from the play pile, they **must swap** that card with one of their face-down hand cards. They **may not** play the taken card straight back onto the pile. The card they took (even if it was a power while on the pile) is now face-down in their hand and **does not** resolve its power until it is **later** played onto the pile like any other card. Only the **displaced** hand card that hits the pile can trigger a power or reaction this turn.
3. Turn ends.

Swap rules when swapping: the player selects their face-down card; the displaced card is played onto the play pile.

## Power Cards

Powers trigger whenever a power card is played onto the play pile **regardless of how it got there** (normal play, swap, or stolen via reaction).

1. **Jack (J):** The player who played it peeks at any one of their own face-down cards, then places it back face-down.
   - They may peek at a card they have already seen — no restriction.
2. **Queen (Q):** The player who played it blindly swaps any two face-down cards on the field.
   - Can be two of their own, one of their own with an opponent's, or two opponents' cards.
   - Nobody sees the cards being swapped.
   - The two selected cards must be at different positions (cannot swap a card with itself).
3. **Red King (♥ or ♦):** The player who played it takes the top card of the draw deck and places it face-down at the **far right** of any player's hand (including their own).
   - Nobody sees this card.
4. **Black King (♠ or ♣):** The player who played it peeks at any one face-down card on the field (including their own), then must swap it to any different position on the field.
   - The peeked card **cannot** be returned to its original spot.

## King Suit Rule

Kings are the **ONLY** card where suit matters.

- **Red Kings (♥♦)** and **Black Kings (♠♣)** are treated as **different ranks** for all purposes, including reactions.

## The Reaction Mechanic

Any time a card is played onto the play pile (by any means), **any player including the active player may instantly react**.

### One-Attempt Rule

Each player gets **exactly one reaction attempt per card played**.

- This covers both reacting with their own card **and** stealing from an opponent.
- You cannot fail a steal and then try to react with your own card.
- **One attempt per player per card played, period.**

### Reacting With Your Own Card

1. If you believe one of your own face-down cards matches the rank of the card just played, grab it and play it onto the pile.
2. If correct: your card is played, and you have one fewer card.
3. If incorrect: take your card back and draw a penalty card from the top of the draw deck.

### Stealing From an Opponent

1. If you believe a specific face-down card in another player's hand matches the rank just played, you may grab it and play it.
2. If correct: the card is played onto the pile, and you give any one of your own face-down cards to the victim. You end up with one fewer card net.
3. If the stolen card is a power card, the **THIEF** controls and benefits from the power.
4. **If incorrect:** the grabbed card is returned to its **original position** in the opponent's hand, and the thief draws **one penalty card** from the draw deck. The thief does **not** keep the incorrectly identified card — it goes straight back to the opponent.

### Additional Reaction Rules

1. **First-success penalty rule:** Only the **FIRST** player to react successfully loses a card.
   - Any subsequent reactor, even if correct, must take their card back and draw a penalty card.
2. **No reaction chaining:** Reactions cannot chain — you cannot react to a card that was itself played via a reaction.
3. **King match restriction:** Red King only matches Red King; Black King only matches Black King.
4. **Suit irrelevant for non-Kings:** Suit does not matter for any other card — only rank.

## Players With 0 Cards

1. Game continues normally.
2. A player with 0 cards must play whatever they draw — **no swapping option**.
3. A player with 0 cards can still call **Check**.
4. 0 cards does not guarantee a win since other players may hold Jokers (-1 points).

## Draw Deck Exhaustion

If the draw deck runs out:

1. Shuffle the play pile into a new draw deck.
2. The top card of the play pile is preserved and stays as the active top card.

## Calling Check & Ending the Game

### Calling Check

At the **START of your turn** before drawing, you may call **"Check"** if you believe you have the lowest total points.

After calling Check:

1. The calling player takes a full normal turn.
2. Then every other player takes **one final turn in order**.
3. After all final turns, everyone reveals their hand and scores are tallied.

### Winning

- Lowest total points wins.
- **Tiebreaker 1:** fewest cards wins.
- **Tiebreaker 2:** if still tied, the player closest to the check-caller in turn order wins (they survived longer without being targeted in the final round).
- No penalty if the check-caller does not have the lowest score — the winner is simply whoever does.

## Lobby & Room System

1. Players can play via a lobby using room codes.
2. From the dashboard, a player chooses **Casual** mode, then either **Create a Room** or **Join a Room** with a code.
3. Rooms have a unique **6-character** join code that is easy to share.
4. The room creator is the host and can start the game once **3–12 players** have joined.
5. The lobby shows all connected players waiting.
6. After a game ends, all players return to the lobby and the host can start a new game.
7. **Accounts & Stats:**
   - Players can sign up or sign in with Supabase Auth.
   - Signed-in players have their wins, games played, and points tracked automatically after every game.
   - Guests can play without an account but are not tracked and do not appear on the leaderboard.

## Real-Time Reaction Mechanic Implementation Notes

This is the most technically complex feature. Implement it as follows:

1. When a card lands on the play pile, the server opens a short reaction window (around **2–3 seconds**).
2. During this window, clients can emit a reaction event (either own card or steal attempt) with a server-side timestamp.
3. The server processes reactions in the order they are received (first timestamp wins).
4. The server validates the reaction (correct rank, player has not already used their one attempt this round, etc.).
5. The server then emits the result to all players (success or failure with penalty).
6. Reactions are closed once the window expires or the first valid reaction is processed.
7. The active player can also react to their own played card — this is valid and intentional.
