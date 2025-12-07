// TODO: Init flow: auth → room → game
import { useEffect, useState } from 'react';
import { useGameState } from './use-game-state';

export function useGameBoot() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TODO: Boot sequence
  useEffect(() => {
    async function boot() {
      try {
        // TODO: Step 1: Auth - load principal
        // TODO: Step 2: Load room
        // TODO: Step 3: Load game canister
        // TODO: Step 4: Initialize polling
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Boot failed');
        setIsLoading(false);
      }
    }
    
    boot();
  }, []);
  
  return { isLoading, error };
}



