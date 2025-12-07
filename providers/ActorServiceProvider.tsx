'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Actor } from '@dfinity/agent';
import { useAuthStore } from '@/store/auth-store';
import { SkillModuleService } from '@/lib/services/actors/SkillModuleService';
import { PlayerService } from '@/lib/services/actors/PlayerService';
import type { ActorBaseService } from '@/lib/services/actors/ActorBaseService';

/**
 * Service instances available through the context.
 * Add new services here as they are created.
 */
interface ActorServices {
  skillModuleService: SkillModuleService;
  playerService: PlayerService;
  // Future services can be added here:
  // gameService: GameService;
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

  // Create service instances (singletons)
  const [services] = useState<ActorServices>(() => ({
    skillModuleService: new SkillModuleService(),
    playerService: new PlayerService(),
    // Future services initialized here
  }));

  /**
   * Replace identity on all actors managed by all services.
   */
  const replaceActorIdentities = async () => {
    if (!identity) {
      return;
    }

    try {
      // Collect all services that extend ActorBaseService
      const serviceInstances: ActorBaseService<any>[] = [
        services.skillModuleService,
        services.playerService,
        // Add future services here
      ];

      // Collect all actors from all services
      const allActors: Array<{ name: string; actor: any }> = [];
      for (const service of serviceInstances) {
        const actors = await service.getAllActors();
        allActors.push(...actors);
      }

      // Replace identity on each actor
      for (const { name, actor } of allActors) {
        try {
          const agent = Actor.agentOf(actor);
          await agent.replaceIdentity(identity);
          console.log(`Identity replaced for actor: ${name}`);
        } catch (error) {
          console.error(`Failed to replace identity for actor ${name}:`, error);
        }
      }

      setIsIdentityReplaced(true);
    } catch (error) {
      console.error('Error replacing actor identities:', error);
    }
  };

  /**
   * Watch for identity changes and replace identity on all actors.
   * Only replaces identity once per authentication session.
   */
  useEffect(() => {
    if (!identity || !isAuthenticated || isIdentityReplaced) {
      return;
    }

    replaceActorIdentities();
  }, [identity, isAuthenticated, isIdentityReplaced]);

  /**
   * Reset identity replacement flag when user logs out.
   */
  useEffect(() => {
    if (!isAuthenticated || !identity) {
      setIsIdentityReplaced(false);
    }
  }, [isAuthenticated, identity]);

  return (
    <ActorServiceContext.Provider value={services}>
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

