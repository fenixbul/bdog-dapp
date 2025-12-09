import type { ActorSubclass, Identity } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { createActor } from "@/lib/utils/actor-factory";
import { Actor } from "@dfinity/agent";

/**
 * Configuration metadata for actor services.
 * Defines how each service should be initialized and managed.
 */
export interface ActorConfig {
  /**
   * Whether this service requires authenticated identity.
   * If true, service cannot work with anonymous identity.
   */
  requiresAuth: boolean;

  /**
   * Whether to initialize actor on mount (eager) vs on first use (lazy).
   * true = initialize immediately when service is created
   * false = initialize when first accessed via getActor()
   */
  initOnMount: boolean;

  /**
   * Whether this service can work with anonymous identity.
   * If true, service supports both anonymous and authenticated identities.
   * If false, service only works with authenticated identity (requiresAuth must be true).
   */
  canUseAnonymous: boolean;

  /**
   * Initialization priority for actor manager.
   * 'high' = initialize before 'normal' priority services
   * 'normal' = standard initialization order
   */
  priority: 'high' | 'normal';
}

/**
 * Base class for all actor-based services.
 * Provides lazy initialization, standardized error handling, and identity replacement interface.
 * 
 * @template T - The actor service type (e.g., _SERVICE from canister declarations)
 */
export abstract class ActorBaseService<T extends ActorSubclass<any>> {
  /**
   * Canister name matching the key in actor-factory.ts CANISTER_IDS
   * Must be implemented by subclasses
   */
  protected abstract canisterName: string;

  /**
   * IDL factory from generated canister declarations
   * Must be implemented by subclasses
   */
  protected abstract idlFactory: IDL.InterfaceFactory;

  /**
   * Actor configuration metadata.
   * Must be implemented by subclasses to define service behavior.
   */
  protected abstract actorConfig: ActorConfig;

  /**
   * Public getter for actor configuration.
   * Allows external access to service configuration for ActorManager.
   */
  get config(): ActorConfig {
    return this.actorConfig;
  }

  /**
   * Private actor instance (lazy initialized)
   * @deprecated Will be replaced by _anonymousActor and _authenticatedActor in future phases
   */
  private _actor?: T;

  /**
   * Cached promise for actor initialization to avoid multiple initializations
   * @deprecated Will be replaced by separate promises for anonymous/authenticated in future phases
   */
  private _actorInitPromise?: Promise<T>;

  /**
   * Anonymous actor instance (created with anonymous identity).
   * Used for services that support anonymous access.
   * Internal use only - not exposed in public API yet.
   */
  private _anonymousActor?: T;

  /**
   * Authenticated actor instance (created with user identity).
   * Used when user is authenticated.
   * Internal use only - not exposed in public API yet.
   */
  private _authenticatedActor?: T;

  /**
   * Cached promise for anonymous actor initialization.
   * Prevents multiple simultaneous initializations.
   */
  private _anonymousActorInitPromise?: Promise<T>;

  /**
   * Cached promise for authenticated actor initialization.
   * Prevents multiple simultaneous initializations.
   */
  private _authenticatedActorInitPromise?: Promise<T>;

  /**
   * Lazy initialization getter for actor instance.
   * Actor is created only when first accessed.
   * Ensures agent is fully initialized (root key fetched) before creating actor.
   */
  protected async getActor(): Promise<T> {
    if (this._actor) {
      return this._actor;
    }

    // Return cached promise if initialization is already in progress
    if (this._actorInitPromise) {
      return this._actorInitPromise;
    }

    // Initialize actor and cache the promise
    this._actorInitPromise = createActor<T>(this.canisterName, this.idlFactory);
    this._actor = await this._actorInitPromise;
    
    return this._actor;
  }

  /**
   * @deprecated Use getActor() instead. This getter is kept for backward compatibility
   * but will throw an error if actor is not already initialized.
   */
  protected get actor(): T {
    if (!this._actor) {
      throw new Error(
        `Actor for ${this.canisterName} is not initialized. ` +
        `Use getActor() method instead for lazy initialization.`
      );
    }
    return this._actor;
  }

  /**
   * Standardized error handling wrapper for canister calls.
   * Catches errors, adds context, and re-throws with descriptive messages.
   * 
   * @param operation - Async function that performs the canister call
   * @param operationName - Human-readable name for the operation (for error messages)
   * @returns Promise resolving to the operation result
   * @throws Error with contextual information if operation fails
   */
  protected async callCanister<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error calling canister ${this.canisterName} - ${operationName}:`, errorMessage);
      throw new Error(`Failed to ${operationName}: ${errorMessage}`);
    }
  }

  /**
   * Get all actors managed by this service.
   * Used by ActorServiceProvider for identity replacement.
   * 
   * @returns Array of actor name and instance pairs
   */
  async getAllActors(): Promise<Array<{ name: string; actor: T }>> {
    const actor = await this.getActor();
    return [{ name: this.canisterName, actor }];
  }

  /**
   * Clear the actor cache, forcing recreation on next access.
   * Called on logout to ensure actors are recreated with anonymous identity.
   */
  clearActorCache(): void {
    this._actor = undefined;
    this._actorInitPromise = undefined;
    // Also clear dual actor storage (for future use)
    this._authenticatedActor = undefined;
    this._authenticatedActorInitPromise = undefined;
    // Keep anonymous actor - it can be reused
  }

  /**
   * Internal method to initialize anonymous actor.
   * Creates actor with anonymous identity (no user authentication).
   * Used internally for dual-identity support (Phase 4+).
   * 
   * @returns Promise resolving to anonymous actor instance
   */
  protected async _initAnonymousActor(): Promise<T> {
    if (this._anonymousActor) {
      return this._anonymousActor;
    }

    // Return cached promise if initialization is already in progress
    if (this._anonymousActorInitPromise) {
      return this._anonymousActorInitPromise;
    }

    console.log(`[ActorBaseService] 🔓 CREATE ANONYMOUS: ${this.canisterName}`);
    
    // Initialize anonymous actor (no identity parameter = anonymous)
    this._anonymousActorInitPromise = createActor<T>(
      this.canisterName,
      this.idlFactory,
      null // Explicitly null = anonymous identity
    );
    this._anonymousActor = await this._anonymousActorInitPromise;

    console.log(`[ActorBaseService] ✅ ANONYMOUS READY: ${this.canisterName}`);
    return this._anonymousActor;
  }

  /**
   * Internal method to initialize authenticated actor.
   * Creates actor with the provided user identity.
   * Used internally for dual-identity support (Phase 4+).
   * 
   * @param identity - The authenticated user identity
   * @returns Promise resolving to authenticated actor instance
   * @throws Error if identity is null or anonymous
   */
  protected async _initAuthenticatedActor(identity: Identity): Promise<T> {
    if (!identity) {
      throw new Error('Identity is required for authenticated actor initialization');
    }

    if (this._authenticatedActor) {
      return this._authenticatedActor;
    }

    // Return cached promise if initialization is already in progress
    if (this._authenticatedActorInitPromise) {
      return this._authenticatedActorInitPromise;
    }

    const principal = identity.getPrincipal().toText();
    console.log(`[ActorBaseService] 🔐 CREATE AUTH: ${this.canisterName} (${principal.substring(0, 8)}...)`);

    // Initialize authenticated actor with provided identity
    this._authenticatedActorInitPromise = createActor<T>(
      this.canisterName,
      this.idlFactory,
      identity
    );
    this._authenticatedActor = await this._authenticatedActorInitPromise;

    console.log(`[ActorBaseService] ✅ AUTH READY: ${this.canisterName}`);
    return this._authenticatedActor;
  }

  /**
   * Clear authenticated actor cache.
   * Called on logout to remove authenticated actor instance.
   * Keeps anonymous actor for reuse.
   * Internal method for future use (Phase 4+).
   */
  protected _clearAuthenticatedActor(): void {
    this._authenticatedActor = undefined;
    this._authenticatedActorInitPromise = undefined;
  }

  /**
   * Helper method to get current identity from auth store.
   * Returns null if no authenticated identity is available.
   * Used by services that support dual-identity pattern (Phase 4+).
   * 
   * @returns Current identity if authenticated, null otherwise
   */
  protected _getCurrentIdentity(): Identity | null {
    // Access auth store directly (Zustand stores can be used outside React)
    // Using dynamic import to avoid circular dependencies
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useAuthStore } = require('@/store/auth-store');
      const authStore = useAuthStore.getState();
      
      const identity = authStore.identity;
      
      // Validate identity is not null/undefined and not anonymous
      if (!identity) {
        return null;
      }
      
      // Check if identity is anonymous
      try {
        const principal = identity.getPrincipal();
        // Compare with anonymous principal
        if (principal.toText() === Principal.anonymous().toText()) {
          return null;
        }
      } catch {
        // If we can't get principal, treat as invalid
        return null;
      }
      
      return identity;
    } catch (error) {
      // If auth store is not available, return null (anonymous)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[ActorBaseService] Could not access auth store:`, error);
      }
      return null;
    }
  }

  /**
   * Helper method to check if current identity is authenticated.
   * Used by services that support dual-identity pattern (Phase 4+).
   * 
   * @returns true if authenticated identity is available, false otherwise
   */
  protected _isAuthenticated(): boolean {
    return this._getCurrentIdentity() !== null;
  }
}
