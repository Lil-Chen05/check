# Architecture (High Level)

This project is split into two parts:

- `client/`: React + Vite UI
- `server/`: Node + Express + Socket.io real-time backend

## Client (`client/`)

- Uses React Router for pages like `/home`, `/lobby/:roomCode`, and `/game/:roomCode`.
- Creates a Socket.io connection using [`client/src/hooks/useSocket.js`](../client/src/hooks/useSocket.js).
- Emits socket events for gameplay actions (draw/play/swap/check/powers/reactions).
- Renders the authoritative, server-filtered `game-state` it receives from the backend.

## Server (`server/`)

- Exposes an HTTP server plus Socket.io.
- Maintains a `rooms` map in memory; each room holds a `GameState` instance.
- Registers socket event handlers:
  - [`server/socket/roomHandlers.js`](../server/socket/roomHandlers.js): create/join/leave game rooms
  - [`server/socket/gameHandlers.js`](../server/socket/gameHandlers.js): turn actions (draw/play/swap/check/power resolution)
  - [`server/socket/reactionHandlers.js`](../server/socket/reactionHandlers.js): reaction window events

## Game Rules Source of Truth (`server/game/*`)

Gameplay rules are implemented server-side in:

- `server/game/Deck.js`: deck creation/shuffling and power-card identification
- `server/game/GameState.js`: the main state machine (phases/turn advancement/reaction window integration)
- `server/game/PowerCards.js`: how J/Q/K powers resolve
- `server/game/Reactions.js`: reaction window logic and penalty/success outcomes
- `server/game/Scoring.js`: point calculation and tie-breakers

All clients are expected to trust the server; they should not attempt to simulate or validate game rules locally.

