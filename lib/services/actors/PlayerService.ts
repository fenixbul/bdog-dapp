import { ActorBaseService } from "./ActorBaseService";
import type { ActorConfig } from "./ActorBaseService";
import { idlFactory } from "@/lib/canisters/player_manager";
import type { _SERVICE as PlayerManagerServiceType } from "@/lib/canisters/player_manager/player_manager.did";
import type { Player } from "@/lib/canisters/player_manager/player_manager.did";
import type { Principal } from "@dfinity/principal";

/**
 * Service for interacting with the PlayerManager canister.
 * Provides methods for managing player profiles and verification.
 */
export class PlayerService extends ActorBaseService<PlayerManagerServiceType> {
  protected canisterName = "player_manager";
  protected idlFactory = idlFactory;

  /**
   * Actor configuration for PlayerService.
   * - Requires authenticated identity (all operations need user context)
   * - Cannot work with anonymous identity
   * - Lazy initialization (created on first access)
   */
  protected actorConfig: ActorConfig = {
    requiresAuth: true,
    initOnMount: false,
    canUseAnonymous: false,
    priority: 'normal',
  };

  /**
   * Override getActor() to require authenticated identity.
   * PlayerService cannot work with anonymous identity.
   * 
   * @returns Promise resolving to authenticated actor instance
   * @throws Error if not authenticated
   */
  protected async getActor(): Promise<PlayerManagerServiceType> {
    const isAuthenticated = this._isAuthenticated();

    if (!isAuthenticated) {
      throw new Error('PlayerService requires authenticated identity');
    }

    const identity = this._getCurrentIdentity();
    if (!identity) {
      throw new Error('PlayerService requires authenticated identity');
    }

    console.log('[PlayerService] 🔐 GET ACTOR: Using authenticated');
    return await this._initAuthenticatedActor(identity);
  }

  /**
   * Get the current player's profile.
   * @returns The player profile if found, null if player doesn't exist
   */
  async getPlayer(): Promise<Player | null> {
    try {
      const actor = await this.getActor();
      const result = await actor.getPlayer();
      
      if ('err' in result) {
        // "Player not found" is expected for new users, treat as null not error
        if (result.err === "Player not found") {
          return null;
        }
        throw new Error(result.err);
      }
      
      return result.ok;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error getting player:', errorMessage);
      throw new Error(`Failed to get player: ${errorMessage}`);
    }
  }

  /**
   * Create a new player profile.
   * @param referrerPid - Optional referrer principal ID
   * @returns The created player profile
   */
  async createPlayer(referrerPid?: Principal): Promise<Player> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        const result = await actor.createPlayer(referrerPid ? [referrerPid] : []);
        if ('err' in result) {
          throw new Error(result.err);
        }
        return result.ok;
      },
      "create player"
    );
  }

  /**
   * Get verification code for X (Twitter) verification.
   * @returns The verification code
   */
  async getVerificationCode(): Promise<string> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        const result = await actor.getVerificationCode();
        if ('err' in result) {
          throw new Error(result.err);
        }
        return result.ok;
      },
      "get verification code"
    );
  }

  /**
   * Trigger X (Twitter) verification for the current player.
   * @param xTweetId - The tweet URL containing the verification code
   * @returns The verified user data
   */
  async triggerXVerification(xTweetId: string): Promise<{
    principal: Principal;
    username: string;
    createdAt: string;
    profileImageUrl: string;
    verifiedAt: bigint;
  }> {
    return this.callCanister(
      async () => {
        const actor = await this.getActor();
        const result = await actor.triggerXVerification(xTweetId);
        if ('err' in result) {
          throw new Error(result.err);
        }
        return result.ok;
      },
      "trigger X verification"
    );
  }
}

