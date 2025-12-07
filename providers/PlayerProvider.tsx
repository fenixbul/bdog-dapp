'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useActorServices } from '@/providers/ActorServiceProvider';
import { LoadingOverlay } from '@/components/layout/LoadingOverlay';
import type { Player } from '@/lib/canisters/player_manager/player_manager.did';

interface PlayerContextValue {
  player: Player | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  verificationCode: string | null;
  loadingVerificationCode: boolean;
  fetchVerificationCode: () => Promise<void>;
  isCreatingPlayer: boolean;
  isPlayerReady: boolean;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

interface PlayerProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages player profile data.
 * 
 * Responsibilities:
 * - Fetches player profile when user is authenticated and identity is replaced
 * - Manages player state (loading, error, data)
 * - Provides player data via React context
 * - Automatically refetches on authentication
 */
export function PlayerProvider({ children }: PlayerProviderProps) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { playerService } = useActorServices();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [loadingVerificationCode, setLoadingVerificationCode] = useState(false);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

  /**
   * Fetch player profile from the backend.
   * Only attempts fetch if authenticated and identity has been replaced.
   * Automatically creates player if one doesn't exist.
   */
  const fetchPlayer = useCallback(async () => {
    if (!isAuthenticated) {
      setPlayer(null);
      setError(null);
      setHasAttemptedFetch(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let playerData = await playerService.getPlayer();
      
      // If player doesn't exist, create one automatically
      if (!playerData) {
        setIsCreatingPlayer(true);
        try {
          playerData = await playerService.createPlayer();
          console.log('Player created successfully');
        } catch (createErr) {
          const createErrorMessage = createErr instanceof Error ? createErr.message : String(createErr);
          console.error('Error creating player:', createErrorMessage);
          setError(createErrorMessage);
          setPlayer(null);
          setHasAttemptedFetch(true);
          setIsCreatingPlayer(false);
          setLoading(false);
          return;
        } finally {
          setIsCreatingPlayer(false);
        }
      }
      
      setPlayer(playerData);
      setHasAttemptedFetch(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error fetching player:', errorMessage);
      
      // If it's an identity/authentication error, don't set error state
      // Just wait for identity to be replaced
      if (errorMessage.includes('identity') || errorMessage.includes('authentication')) {
        setError(null);
        return;
      }
      
      setError(errorMessage);
      setPlayer(null);
      setHasAttemptedFetch(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, playerService]);

  /**
   * Watch for authentication and fetch player data.
   * Waits for auth initialization, then attempts to fetch.
   * Uses a small delay to ensure identity replacement has completed.
   */
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated) {
      // Reset state on logout
      setPlayer(null);
      setError(null);
      setLoading(false);
      setHasAttemptedFetch(false);
      setIsCreatingPlayer(false);
      return;
    }

    // If already attempted and we're still authenticated, don't refetch automatically
    // (use refetch() method for manual refresh)
    if (hasAttemptedFetch) {
      return;
    }

    // Small delay to ensure identity replacement has completed
    // ActorServiceProvider replaces identity when isAuthenticated becomes true
    const timer = setTimeout(() => {
      fetchPlayer();
    }, 100);

    return () => clearTimeout(timer);
  }, [isInitialized, isAuthenticated, hasAttemptedFetch, fetchPlayer]);

  /**
   * Manual refetch function for components to trigger.
   */
  const refetch = useCallback(async () => {
    setHasAttemptedFetch(false);
    await fetchPlayer();
  }, [fetchPlayer]);

  /**
   * Fetch verification code from the backend.
   * Lazy loading - only fetches when needed.
   */
  const fetchVerificationCode = useCallback(async () => {
    if (!isAuthenticated) {
      setVerificationCode(null);
      return;
    }

    // Return cached code if already loaded
    if (verificationCode) {
      return;
    }

    try {
      setLoadingVerificationCode(true);
      const code = await playerService.getVerificationCode();
      setVerificationCode(code);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error fetching verification code:', errorMessage);
      // Don't set error state, just log it
      // Component can handle retry if needed
    } finally {
      setLoadingVerificationCode(false);
    }
  }, [isAuthenticated, playerService, verificationCode]);

  // Compute isPlayerReady: true when player exists, creation complete, or not authenticated
  const isPlayerReady = !isAuthenticated || (player !== null && !isCreatingPlayer);

  const value: PlayerContextValue = {
    player,
    loading,
    error,
    refetch,
    verificationCode,
    loadingVerificationCode,
    fetchVerificationCode,
    isCreatingPlayer,
    isPlayerReady,
  };

  return (
    <PlayerContext.Provider value={value}>
      {/* Block app with loading overlay when authenticated but player not ready */}
      {isAuthenticated && !isPlayerReady && <LoadingOverlay />}
      {children}
    </PlayerContext.Provider>
  );
}

/**
 * Hook to access player data from React components.
 * 
 * @returns PlayerContextValue with player data, loading state, error, and refetch function
 * @throws Error if used outside of PlayerProvider
 * 
 * @example
 * ```tsx
 * const { player, loading, error, refetch } = usePlayer();
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (!player) return <div>No player found</div>;
 * return <div>Welcome {player.player_id}</div>;
 * ```
 */
export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  
  return context;
}

