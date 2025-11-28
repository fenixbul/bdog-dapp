# Dice Wards — Backend MVP Tech Specification (ICP / Motoko)

This document defines the **finalized backend architecture** for Dice Wards MVP using three canisters:

- **Profiles Canister**
- **Lobbies Canister**
- **GameEngine Canister** (single canister managing many games by ID)

All logic follows the confirmed Dice Wards game rules and the design decisions provided.

---

# 1. Global Game Rules (Confirmed)

- **Players:** 2 players per game, identified by ICP principal.
- **Win Condition:** First to reach **≥100 points** on a Hold action (or timeout-hold).
- **Turn Rules:**
  - Player may **Roll** or **Hold** during their turn.
  - **Roll:**
    - Dice result 1–6.
    - If **1:** round score resets to 0, turn ends, passes to opponent.
    - If **2–6:** round score increases; player may act again.
  - **Hold:**
    - Add round score to total score; reset round score.
    - Check for win (≥100).
    - If no win: turn passes to opponent.
- **Timeout (30s):**
  - Each turn has a 30s action window.
  - Timer resets on every valid Roll/Hold.
  - If 30s expire → **timeout = Hold**:
    - Bank round score.
    - Check win.
    - If no win: pass turn to opponent with new timer.
- **Post-Finish Behavior:** All actions return a `GameFinished` error; game state is frozen.
- **Resign:** Skipped in MVP (not included).

---

# 2. Shared Concepts

- **Player:** principal ID.
- **Player Role:** Player1 or Player2.
- **Room:** one room → one game (non-reusable).
- **Game Instance:** stored and managed inside the single GameEngine canister, indexed by roomId.
- **Error Types:** NotYourTurn, GameFinished, Unauthorized, RoomFull, RoomNotFound, AlreadyInRoom, InvalidState.

---

# 3. Profiles Canister (MVP-Light)

## Purpose
- Minimal player account storage.
- Simple stats tracking.

## Data
Each profile stores:
- Player principal
- Username
- Created timestamp
- **gamesPlayed**
- **gamesWon**

## Responsibilities
- Create/update basic profile upon login.
- Expose lightweight profile summaries.
- Update stats when a game finishes (increment gamesPlayed and gamesWon).

## Public Interface (Conceptual)
- `upsertProfile(username)` → creates/updates profile for caller.
- `getMyProfile()` → returns caller’s profile summary.
- `getProfile(playerId)` → returns profile of another player.
- `onGameFinished(winnerId, loserId)` → increments stats accordingly.

---

# 4. Lobbies Canister

## Purpose
- Manage **rooms**, matchmaking, and game setup.
- Assign rooms to game instances inside the shared GameEngine canister.

## Data
Each room contains:
- id, name, owner
- player1 slot
- player2 slot
- status: WaitingForPlayers / InGame / Finished
- gameId (identifier used by GameEngine)
- created timestamp

## Responsibilities
- Create rooms (caller = Player1).
- Join rooms (assign caller to Player2).
- Prevent same principal from occupying both slots.
- When room becomes full, create a **new game instance** in GameEngine (gameId per room).
- Update room status when game ends.

## Public Interface (Conceptual)
- `createRoom`
- `joinRoom(roomId)` → validates and joins; returns gameId.
- `listRooms`
- `getRoom(roomId)` → full room details.

---

# 5. GameEngine Canister (Single Canister Managing Many Games)

## Purpose
- Host and run **all game instances**.
- Store game states indexed by roomId.
- Enforce all Dice Wards rules.
- Manage timers, dice rolls, and win condition.
- Provide safe views to frontend.

## Data (Per Game Instance)
- roomId
- player1 principal
- player2 principal
- status: WaitingForPlayers / InProgress / Finished
- scores (total P1, total P2)
- round score (active player)
- turn state:
  - active player
  - turnId
  - turn start timestamp
  - turn expiration timestamp (30s)
- last dice roll
- winner role
- created timestamp

All instances held in a map/dictionary keyed by roomId.

## Responsibilities
- Initialize a new game when Lobby requests it.
- Process **Roll** and **Hold** actions with full rule enforcement.
- Handle **timeout = hold** behavior.
- Validate turn ownership and game state before actions.
- Detect and apply turn expiration.
- Determine winners and finalize game.
- Send finish callbacks to Profiles and Lobbies.

## Public Interface (Conceptual)
- `initGame(roomId, player1Id, player2Id)`  
  Creates a new game instance for the room.

- `roll(roomId)`  
  Performs dice roll for caller; returns updated game view or error.

- `hold(roomId)`  
  Banks score, checks win, switches turn; returns updated game view or error.

- `getGameState(roomId)`  
  Returns full game view for caller and applies any pending timeout logic.

- `checkTimeout(roomId)`  
  Optional manual timeout check; generally invoked internally or via polling.

---

# 6. Game View (Returned to Client)

Each game view contains:
- Complete game state snapshot.
- Caller’s player role (me = P1 or P2).
- Remaining turn time in ms (or null if finished).
- Last dice roll.
- Scores and round score.
- Status and winner (when finished).

---

# 7. Final Confirmed Design Choices (Your Answers)

- **Profile stats:** only `gamesPlayed` and `gamesWon`.
- **Room lifecycle:** **one room = one game** (non-reusable).
- **GameEngine architecture:** **single canister managing many games by ID**.
- **Resign:** **skipped for MVP**.

---

This specification is now consistent, minimal, and ready for implementation or extension.
