// TODO: Local timer synced with backend
import { useState, useEffect, useRef } from 'react';
import { nanosecondsToSeconds } from '@/utils/dice-game/time';
import { GAME_CONFIG } from '@/lib/dice-game/config';

export function useTimerSync(backendTime: bigint | null) {
  const [countdown, setCountdown] = useState<number>(GAME_CONFIG.TURN_TIMEOUT);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // TODO: Sync timer with backend
  useEffect(() => {
    if (!backendTime) return;
    
    // TODO: Calculate initial countdown from backend time
    const initialSeconds = nanosecondsToSeconds(backendTime);
    setCountdown(initialSeconds);
    
    // TODO: Update countdown every second
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [backendTime]);
  
  return countdown;
}



