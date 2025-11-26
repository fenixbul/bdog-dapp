'use client';

import { GameFrame } from '@/components/dice-game/GameFrame';
import { GameStateProvider } from '@/contexts/dice-game/GameStateProvider';
import { EntryScreen } from '@/components/dice-game/Screens/EntryScreen';
import { LobbyScreen } from '@/components/dice-game/Screens/LobbyScreen';
import { RoomScreen } from '@/components/dice-game/Screens/RoomScreen';
import { PlayScreen } from '@/components/dice-game/Screens/PlayScreen';
import { ResultScreen } from '@/components/dice-game/Screens/ResultScreen';

// TODO: Single-entry game app (handles all screens)
// - Screen routing via state
// - Entry → Lobby → Room → Play → Result
export default function DiceGamePage() {
  // TODO: Get current screen from state
  const currentScreen = 'entry'; // TODO: Replace with state
  
  // TODO: Render screen based on state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'entry':
        return <EntryScreen />;
      case 'lobby':
        return <LobbyScreen />;
      case 'room':
        return <RoomScreen />;
      case 'play':
        return <PlayScreen />;
      case 'result':
        return <ResultScreen />;
      default:
        return <EntryScreen />;
    }
  };
  
  return (
    <GameStateProvider>
      <GameFrame>
        {renderScreen()}
      </GameFrame>
    </GameStateProvider>
  );
}

