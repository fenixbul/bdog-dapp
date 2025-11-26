// TODO: Access game state context
import { useGameStateContext } from '@/contexts/dice-game/GameStateContext';

export function useGameState() {
  // TODO: Get context
  const context = useGameStateContext();
  
  // TODO: Return game state and helpers
  return {
    gameState: context.gameState,
    playerState: context.playerState,
    roomState: context.roomState,
    uiState: context.uiState,
    // TODO: Add helper methods
  };
}

