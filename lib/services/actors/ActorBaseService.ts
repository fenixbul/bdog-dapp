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
   * Lazy initialization getter for actor instance.
   * Actor is created only when first accessed.
   */
  protected get actor(): T {
    if (!this._actor) {
      this._actor = createActor<T>(this.canisterName, this.idlFactory);
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
   * 
   * @returns Array of { name, actor } objects
   */
  getAllActors(): Array<{ name: string; actor: any }> {
    return [{ name: this.canisterName, actor: this.actor }];
  }
}

