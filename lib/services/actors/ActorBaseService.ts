import type { ActorSubclass } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import { createActor } from "@/lib/utils/actor-factory";

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
   * Private actor instance (lazy initialized)
   */
  private _actor?: T;

  /**
   * Cached promise for actor initialization to avoid multiple initializations
   */
  private _actorInitPromise?: Promise<T>;

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
        `Use await getActor() instead, or ensure the actor is initialized first.`
      );
    }
    return this._actor;
  }

  /**
   * Standardized canister call wrapper with error handling.
   * Handles the common { ok, err } response pattern automatically.
   * 
   * @param fn - Function that calls the canister method
   * @param operationName - Human-readable name for error messages
   * @returns The result value (extracted from { ok } if applicable)
   * @throws Error if the call fails or returns { err }
   */
  protected async callCanister<R>(
    fn: () => Promise<R | { ok: R } | { err: string }>,
    operationName: string
  ): Promise<R> {
    try {
      const result = await fn();

      // Handle { ok, err } pattern
      if (result && typeof result === 'object' && 'err' in result) {
        throw new Error(`Failed to ${operationName}: ${result.err}`);
      }

      // Extract ok value if present, otherwise return result as-is
      if (result && typeof result === 'object' && 'ok' in result) {
        return (result as { ok: R }).ok;
      }

      return result as R;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error calling canister ${this.canisterName} - ${operationName}:`, errorMessage);
      throw new Error(`Failed to ${operationName}: ${errorMessage}`);
    }
  }

  /**
   * Returns all actors managed by this service for identity replacement.
   * Override this method if the service manages multiple actors.
   * Ensures actors are initialized before returning them.
   * 
   * @returns Promise resolving to array of { name, actor } objects
   */
  async getAllActors(): Promise<Array<{ name: string; actor: any }>> {
    const actor = await this.getActor();
    return [{ name: this.canisterName, actor }];
  }
}

