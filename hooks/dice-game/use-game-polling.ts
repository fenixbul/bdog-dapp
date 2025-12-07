// TODO: Poll backend every 1-2s
import { useEffect, useRef } from 'react';
import { getGameState } from '@/api/dice-game/game';
import { GAME_CONFIG } from '@/lib/dice-game/config';

export function useGamePolling(gameCanisterId: string | null, enabled: boolean = true) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // TODO: Poll game state
  useEffect(() => {
    if (!enabled || !gameCanisterId) return;
    
    // TODO: Poll immediately
    async function poll() {
      try {
        // TODO: Fetch game state
        await getGameState(gameCanisterId);
      } catch (err) {
        // TODO: Handle polling error
        console.error('Polling error:', err);
      }
    }
    
    poll();
    
    // TODO: Set up interval
    intervalRef.current = setInterval(poll, GAME_CONFIG.POLLING_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameCanisterId, enabled]);
}



