// TODO: Roll/Hold unified action handler
import { useState } from 'react';
import { roll, hold } from '@/api/dice-game/game';

export function useGameActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Roll action
  async function handleRoll(gameCanisterId: string) {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Call roll API
      await roll(gameCanisterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Roll failed');
    } finally {
      setIsLoading(false);
    }
  }
  
  // TODO: Hold action
  async function handleHold(gameCanisterId: string) {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Call hold API
      await hold(gameCanisterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hold failed');
    } finally {
      setIsLoading(false);
    }
  }
  
  return {
    handleRoll,
    handleHold,
    isLoading,
    error,
  };
}


