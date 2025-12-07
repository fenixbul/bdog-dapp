'use client';

import { createContext, useContext } from 'react';
import type { GameState, PlayerState, RoomState, UIState } from '@/lib/dice-game/state';

// TODO: Combined game state context type
export interface GameStateContextType {
  // Game state
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  
  // Player state
  playerState: PlayerState | null;
  setPlayerState: (state: PlayerState | null) => void;
  
  // Room state
  roomState: RoomState | null;
  setRoomState: (state: RoomState | null) => void;
  
  // UI state
  uiState: UIState | null;
  setUIState: (state: UIState | null) => void;
  
  // TODO: Add more context methods as needed
}

// TODO: Create context
export const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

// TODO: Context hook
export function useGameStateContext() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameStateContext must be used within GameStateProvider');
  }
  return context;
}



