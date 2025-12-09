import type { Identity } from '@dfinity/agent';
import type { ActorBaseService } from './ActorBaseService';
import type { ActorConfig } from './ActorBaseService';

/**
 * Actor state for tracking initialization status.
 */
export type ActorState = 'ready' | 'initializing' | 'error';

/**
 * Identity type for actor instances.
 */
export type IdentityType = 'anonymous' | 'authenticated';

/**
 * Event emitted by ActorManager when actor state changes.
 */
export type ActorStateEvent =
  | { type: 'actor:ready'; serviceName: string; identity: IdentityType }
  | { type: 'actor:initializing'; serviceName: string; identity: IdentityType }
  | { type: 'actor:error'; serviceName: string; identity: IdentityType; error: Error }
  | { type: 'actors:all-ready'; identity: IdentityType }
  | { type: 'actors:initialization-started'; identity: IdentityType }
  | { type: 'actors:initialization-complete'; identity: IdentityType }
  | { type: 'actors:initialization-failed'; identity: IdentityType; errors: Array<{ serviceName: string; error: Error }> };

/**
 * Service registration entry.
 */
interface ServiceRegistration {
  service: ActorBaseService<any>;
  config: ActorConfig;
  name: string;
}

/**
 * Actor state tracking entry.
 */
interface ActorStateEntry {
  state: ActorState;
  identity: IdentityType | null;
  error?: Error;
}

/**
 * Event subscription callback type.
 */
type EventCallback = (event: ActorStateEvent) => void;

/**
 * ActorManager manages actor service lifecycle and identity-aware initialization.
 * 
 * Responsibilities:
 * - Register actor services with their configurations
 * - Initialize actors based on identity (anonymous or authenticated)
 * - Track actor state (ready, initializing, error)
 * - Emit events for state changes
 * - Handle reinitialization on identity changes
 * - Clear authenticated actors on logout
 * 
 * This class is created but not yet integrated into ActorServiceProvider (Phase 6+).
 */
export class ActorManager {
  /**
   * Registry of all registered services.
   */
  private services: Map<string, ServiceRegistration> = new Map();

  /**
   * State tracking for each service.
   */
  private states: Map<string, ActorStateEntry> = new Map();

  /**
   * Event subscribers.
   */
  private subscribers: Set<EventCallback> = new Set();

  /**
   * Current identity being used for initialization.
   */
  private currentIdentity: Identity | null = null;

  /**
   * Whether initialization is in progress.
   */
  private isInitializing: boolean = false;

  /**
   * Register a service with the manager.
   * 
   * @param name - Unique name for the service (e.g., 'skillModuleService')
   * @param service - Service instance extending ActorBaseService
   * @param config - Actor configuration metadata
   */
  registerService(
    name: string,
    service: ActorBaseService<any>,
    config: ActorConfig
  ): void {
    if (this.services.has(name)) {
      console.warn(`[ActorManager] ⚠️ Service ${name} is already registered. Overwriting.`);
    }

    this.services.set(name, { service, config, name });
    this.states.set(name, {
      state: 'ready',
      identity: null,
    });

    console.log(`[ActorManager] 📝 REGISTER: ${name} (auth: ${config.requiresAuth}, anonymous: ${config.canUseAnonymous})`);
  }

  /**
   * Register multiple services at once.
   * 
   * @param services - Map of service names to service registrations
   */
  registerServices(services: Record<string, { service: ActorBaseService<any>; config: ActorConfig }>): void {
    for (const [name, { service, config }] of Object.entries(services)) {
      this.registerService(name, service, config);
    }
  }

  /**
   * Initialize all actors based on the provided identity.
   * 
   * @param identity - Identity to use for initialization (null = anonymous)
   */
  async initializeActors(identity: Identity | null): Promise<void> {
    if (this.isInitializing) {
      console.warn('[ActorManager] Initialization already in progress. Skipping.');
      return;
    }

    this.isInitializing = true;
    const identityType: IdentityType = identity ? 'authenticated' : 'anonymous';
    this.currentIdentity = identity;

    console.log(`[ActorManager] 🚀 INIT: Starting initialization (${identityType})`);
    this.emit({ type: 'actors:initialization-started', identity: identityType });

    // Sort services by priority (high first, then normal)
    const sortedServices = Array.from(this.services.entries()).sort(([, a], [, b]) => {
      if (a.config.priority === 'high' && b.config.priority === 'normal') return -1;
      if (a.config.priority === 'normal' && b.config.priority === 'high') return 1;
      return 0;
    });

    const errors: Array<{ serviceName: string; error: Error }> = [];

    // Initialize services that should be initialized on mount
    for (const [name, registration] of sortedServices) {
      const { service, config } = registration;

      // Skip if service requires auth but identity is null
      if (config.requiresAuth && !identity) {
        console.log(`[ActorManager] ⏭️ SKIP: ${name} (requires auth, but anonymous)`);
        this.states.set(name, {
          state: 'ready',
          identity: identityType,
        });
        continue;
      }

      // Skip if service cannot use anonymous but identity is null
      if (!config.canUseAnonymous && !identity) {
        console.log(`[ActorManager] ⏭️ SKIP: ${name} (cannot use anonymous)`);
        this.states.set(name, {
          state: 'ready',
          identity: identityType,
        });
        continue;
      }

      // Initialize if initOnMount is true
      if (config.initOnMount) {
        try {
          this.states.set(name, {
            state: 'initializing',
            identity: identityType,
          });
          this.emit({
            type: 'actor:initializing',
            serviceName: name,
            identity: identityType,
          });

          // Trigger actor initialization by calling getActor()
          // This will use the dual-identity pattern if implemented
          console.log(`[ActorManager] 🔄 INIT: ${name} (${identityType})`);
          await service.getActor();

          this.states.set(name, {
            state: 'ready',
            identity: identityType,
          });
          console.log(`[ActorManager] ✅ READY: ${name} (${identityType})`);
          this.emit({
            type: 'actor:ready',
            serviceName: name,
            identity: identityType,
          });
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.states.set(name, {
            state: 'error',
            identity: identityType,
            error: err,
          });
          errors.push({ serviceName: name, error: err });
          this.emit({
            type: 'actor:error',
            serviceName: name,
            identity: identityType,
            error: err,
          });
        }
      } else {
        // Lazy initialization - mark as ready but don't initialize yet
        this.states.set(name, {
          state: 'ready',
          identity: identityType,
        });
      }
    }

    this.isInitializing = false;

    if (errors.length > 0) {
      console.error(`[ActorManager] ❌ INIT FAILED: ${errors.length} error(s) (${identityType})`);
      this.emit({
        type: 'actors:initialization-failed',
        identity: identityType,
        errors,
      });
    } else {
      console.log(`[ActorManager] ✅ INIT COMPLETE: All services ready (${identityType})`);
      this.emit({ type: 'actors:initialization-complete', identity: identityType });
      this.emit({ type: 'actors:all-ready', identity: identityType });
    }
  }

  /**
   * Reinitialize specific actors with a new identity.
   * 
   * @param serviceNames - Names of services to reinitialize
   * @param identity - New identity to use (null = anonymous)
   */
  async reinitializeActors(serviceNames: string[], identity: Identity | null): Promise<void> {
    const identityType: IdentityType = identity ? 'authenticated' : 'anonymous';
    this.currentIdentity = identity;

    console.log(`[ActorManager] 🔄 REINIT: ${serviceNames.join(', ')} (${identityType})`);

    for (const name of serviceNames) {
      const registration = this.services.get(name);
      if (!registration) {
        console.warn(`[ActorManager] Service ${name} not found. Skipping reinitialization.`);
        continue;
      }

      const { service, config } = registration;

      // Validate identity requirements
      if (config.requiresAuth && !identity) {
        this.states.set(name, {
          state: 'error',
          identity: identityType,
          error: new Error('Service requires authenticated identity'),
        });
        continue;
      }

      if (!config.canUseAnonymous && !identity) {
        this.states.set(name, {
          state: 'error',
          identity: identityType,
          error: new Error('Service cannot use anonymous identity'),
        });
        continue;
      }

      try {
        this.states.set(name, {
          state: 'initializing',
          identity: identityType,
        });
        this.emit({
          type: 'actor:initializing',
          serviceName: name,
          identity: identityType,
        });

        // Clear cache and reinitialize
        service.clearActorCache();
        await service.getActor();

        this.states.set(name, {
          state: 'ready',
          identity: identityType,
        });
        this.emit({
          type: 'actor:ready',
          serviceName: name,
          identity: identityType,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.states.set(name, {
          state: 'error',
          identity: identityType,
          error: err,
        });
        this.emit({
          type: 'actor:error',
          serviceName: name,
          identity: identityType,
          error: err,
        });
      }
    }
  }

  /**
   * Clear authenticated actors for all services.
   * Called on logout to remove authenticated actor instances.
   */
  async clearAuthenticatedActors(): Promise<void> {
    console.log('[ActorManager] 🧹 CLEAR: Clearing authenticated actors');
    
    for (const [name, registration] of this.services.entries()) {
      const { service } = registration;
      
      try {
        // Clear actor cache (will clear authenticated actors)
        service.clearActorCache();
        console.log(`[ActorManager] 🧹 CLEARED: ${name}`);
        
        // Update state to reflect anonymous identity
        this.states.set(name, {
          state: 'ready',
          identity: 'anonymous',
        });
      } catch (error) {
        console.error(`[ActorManager] ❌ CLEAR ERROR: ${name}`, error);
      }
    }

    this.currentIdentity = null;
    console.log('[ActorManager] ✅ CLEAR COMPLETE: All authenticated actors cleared');
  }

  /**
   * Get the current state of a specific actor.
   * 
   * @param serviceName - Name of the service
   * @returns Current actor state, or undefined if service not found
   */
  getActorState(serviceName: string): ActorState | undefined {
    const stateEntry = this.states.get(serviceName);
    return stateEntry?.state;
  }

  /**
   * Get all registered service names.
   * 
   * @returns Array of service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Subscribe to actor state events.
   * 
   * @param callback - Function to call when events are emitted
   * @returns Unsubscribe function
   */
  subscribe(callback: EventCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Emit an event to all subscribers.
   * 
   * @param event - Event to emit
   */
  private emit(event: ActorStateEvent): void {
    // Events are handled by subscribers, no verbose logging
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (error) {
        console.error(`[ActorManager] Error in event callback:`, error);
      }
    }
  }

  /**
   * Get current identity being used.
   * 
   * @returns Current identity or null if anonymous
   */
  getCurrentIdentity(): Identity | null {
    return this.currentIdentity;
  }

  /**
   * Check if initialization is in progress.
   * 
   * @returns true if initialization is in progress
   */
  isInitializationInProgress(): boolean {
    return this.isInitializing;
  }
}

