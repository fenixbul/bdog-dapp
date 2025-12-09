'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { Actor } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { useAuthStore } from '@/store/auth-store';
import { SkillModuleService } from '@/lib/services/actors/SkillModuleService';
import { PlayerService } from '@/lib/services/actors/PlayerService';
import type { ActorBaseService } from '@/lib/services/actors/ActorBaseService';
import { ActorManager } from '@/lib/services/actors/ActorManager';

/**
 * Service instances available through the context.
 * Add new services here as they are created.
 */
interface ServiceInstances {
  skillModuleService: SkillModuleService;
  playerService: PlayerService;
  // Future services can be added here:
  // gameService: GameService;
}

/**
 * Full actor services interface including identity replacement status.
 */
interface ActorServices extends ServiceInstances {
  isIdentityReplaced: boolean;
}

/**
 * React context for actor services.
 */
const ActorServiceContext = createContext<ActorServices | undefined>(undefined);

interface ActorServiceProviderProps {
  children: ReactNode;
}

/**
 * Provider component that manages actor services and identity replacement.
 * 
 * Responsibilities:
 * - Creates and manages service instances
 * - Watches for identity changes from auth-store
 * - Replaces identity on all actors when user authenticates
 * - Provides services via React context
 */
export function ActorServiceProvider({ children }: ActorServiceProviderProps) {
  const { identity, isAuthenticated } = useAuthStore();
  const [isIdentityReplaced, setIsIdentityReplaced] = useState(false);
  const prevAuthRef = useRef(isAuthenticated);

  // Create service instances (singletons)
  const [services] = useState<ServiceInstances>(() => ({
    skillModuleService: new SkillModuleService(),
    playerService: new PlayerService(),
    // Future services initialized here
  }));

  // Create ActorManager instance (singleton)
  // Phase 8: ActorManager is now the primary system managing all services
  const actorManagerRef = useRef<ActorManager | null>(null);
  if (!actorManagerRef.current) {
    actorManagerRef.current = new ActorManager();
  }
  const actorManager = actorManagerRef.current;

  // Register all services with ActorManager
  // Phase 8: All services registered and managed by ActorManager
  useEffect(() => {
    actorManager.registerServices({
      skillModuleService: {
        service: services.skillModuleService,
        config: services.skillModuleService.config,
      },
      playerService: {
        service: services.playerService,
        config: services.playerService.config,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[ActorServiceProvider] All services registered with ActorManager');
    }
  }, [actorManager, services]);

  /**
   * @deprecated Phase 8: Manual identity replacement removed.
   * All services are now managed by ActorManager.
   * This function is kept for reference but no longer called.
   */
  const replaceActorIdentities = async () => {
    // Phase 8: All services now managed by ActorManager
    // This function is deprecated and no longer used
    console.warn('[ActorServiceProvider] replaceActorIdentities is deprecated. Use ActorManager instead.');
  };

  /**
   * @deprecated Phase 8: Manual cache clearing removed.
   * All services are now managed by ActorManager.
   * This function is kept for reference but no longer called.
   */
  const clearActorCaches = () => {
    // Phase 8: All services now managed by ActorManager
    // This function is deprecated and no longer used
    console.warn('[ActorServiceProvider] clearActorCaches is deprecated. Use ActorManager instead.');
  };

  /**
   * @deprecated Phase 8: Manual identity replacement removed.
   * ActorManager now handles all identity changes.
   * This effect is kept for reference but disabled.
   */
  // useEffect(() => {
  //   // Phase 8: Disabled - ActorManager handles identity replacement
  //   if (!isAuthenticated || !identity || isIdentityReplaced) {
  //     return;
  //   }
  //   replaceActorIdentities();
  // }, [identity, isAuthenticated, isIdentityReplaced]);

  /**
   * Phase 8: Initialize all actors with ActorManager.
   * ActorManager now handles both SkillModuleService and PlayerService lifecycle.
   * All services use the new dual-identity pattern managed by ActorManager.
   */
  useEffect(() => {
    // Initialize actors with current identity (null = anonymous)
    const currentIdentity = isAuthenticated && identity ? identity : null;
    const identityType = currentIdentity ? 'authenticated' : 'anonymous';
    
    console.log(`[ActorServiceProvider] 🔐 IDENTITY CHANGE: ${identityType} (isAuthenticated: ${isAuthenticated})`);
    
    // ActorManager handles all services initialization
    actorManager.initializeActors(currentIdentity).catch((error) => {
      console.error('[ActorServiceProvider] ❌ INIT ERROR:', error);
    });
  }, [actorManager, isAuthenticated, identity]);

  /**
   * Clear authenticated actors when user logs out.
   * Phase 8: ActorManager handles cleanup for all services.
   */
  useEffect(() => {
    const wasAuthenticated = prevAuthRef.current;
    const isNowAnonymous = !isAuthenticated || !identity;
    
    // Only log logout when transitioning from authenticated to anonymous
    if (wasAuthenticated && isNowAnonymous) {
      console.log('[ActorServiceProvider] 🚪 LOGOUT: Clearing authenticated actors');
      actorManager.clearAuthenticatedActors().catch((error) => {
        console.error('[ActorServiceProvider] ❌ CLEAR ERROR:', error);
      });
    }
    
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, identity, actorManager]);

  return (
    <ActorServiceContext.Provider value={{ ...services, isIdentityReplaced }}>
      {children}
    </ActorServiceContext.Provider>
  );
}

/**
 * Hook to access actor services from React components.
 * 
 * @returns ActorServices object with all available services
 * @throws Error if used outside of ActorServiceProvider
 * 
 * @example
 * ```tsx
 * const { skillModuleService } = useActorServices();
 * const module = await skillModuleService.getModule(moduleId);
 * ```
 */
export function useActorServices(): ActorServices {
  const context = useContext(ActorServiceContext);
  
  if (context === undefined) {
    throw new Error('useActorServices must be used within an ActorServiceProvider');
  }
  
  return context;
}


