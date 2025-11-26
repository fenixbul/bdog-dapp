// TODO: Define game state types and initial state
// - Game state types (GameStatus, Turn, etc.)
// - Player state types
// - Room state types
// - UI state types
// - Initial state values

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type Turn = 'player1' | 'player2';

// TODO: Add game state interface
export interface GameState {
  // TODO: Define game state structure
}

// TODO: Add player state interface
export interface PlayerState {
  // TODO: Define player state structure
}

// TODO: Add room state interface
export interface RoomState {
  // TODO: Define room state structure
}

// TODO: Add UI state interface
export interface UIState {
  // TODO: Define UI state structure
}

// TODO: Initial state values
export const initialGameState: GameState = {
  // TODO: Initialize game state
};

export const initialPlayerState: PlayerState = {
  // TODO: Initialize player state
};

export const initialRoomState: RoomState = {
  // TODO: Initialize room state
};

export const initialUIState: UIState = {
  // TODO: Initialize UI state
};

