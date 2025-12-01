'use client';

import { useState, type ReactNode } from 'react';
import { GameStateContext } from './GameStateContext';
import { 
  initialGameState, 
  initialPlayerState, 
  initialRoomState, 
  initialUIState,
  type GameState,
  type PlayerState,
  type RoomState,
  type UIState
} from '@/lib/dice-game/state';

interface GameStateProviderProps {
  children: ReactNode;
}

// TODO: Merged context provider for game + room + ui state
export function GameStateProvider({ children }: GameStateProviderProps) {
  // TODO: Initialize state
  const [gameState, setGameState] = useState<GameState | null>(initialGameState);
  const [playerState, setPlayerState] = useState<PlayerState | null>(initialPlayerState);
  const [roomState, setRoomState] = useState<RoomState | null>(initialRoomState);
  const [uiState, setUIState] = useState<UIState | null>(initialUIState);

  // TODO: Provide context value
  const value = {
    gameState,
    setGameState,
    playerState,
    setPlayerState,
    roomState,
    setRoomState,
    uiState,
    setUIState,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}


