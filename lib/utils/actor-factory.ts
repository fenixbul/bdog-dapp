import { HttpAgent, Actor } from "@dfinity/agent";
import type { ActorSubclass, Identity } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

/**
 * Canister ID mapping from environment variables.
 * These are injected by dfx.webpack.config.js from canister_ids.json
 */
const CANISTER_IDS = {
  skill_module: process.env.NEXT_PUBLIC_SKILL_MODULE_CANISTER_ID,
  player_manager: process.env.NEXT_PUBLIC_PLAYER_MANAGER_CANISTER_ID,
} as const;

/**
 * Cached agent initialization promise to avoid multiple root key fetches
 */
let agentInitPromise: Promise<HttpAgent> | null = null;

/**
 * Creates an HttpAgent with proper network configuration.
 * - Fetches root key for local development (awaited to ensure readiness)
 * - Uses appropriate host based on network
 * - Caches initialization promise to avoid duplicate fetches
 * - Uses anonymous identity by default
 */
export const createAgent = async (): Promise<HttpAgent> => {
  // Return cached promise if agent initialization is already in progress
  if (agentInitPromise) {
    return agentInitPromise;
  }

  const host = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:8080';
  const agent = new HttpAgent({ host });

  // Initialize agent initialization promise
  agentInitPromise = (async () => {
    // Fetch root key only for local development
    // This MUST be awaited to prevent certificate verification errors
    if (process.env.DFX_NETWORK !== 'ic') {
      try {
        await agent.fetchRootKey();
      } catch (err) {
        console.warn('Unable to fetch root key. Check local replica is running');
        console.error(err);
        // Clear promise on error so we can retry
        agentInitPromise = null;
        throw err;
      }
    }
    return agent;
  })();

  return agentInitPromise;
};

/**
 * Creates an HttpAgent with a specific identity.
 * - Fetches root key for local development (awaited to ensure readiness)
 * - Uses appropriate host based on network
 * - Uses the provided identity instead of anonymous
 * - Does not cache (each identity gets its own agent)
 * 
 * @param identity - The identity to use for the agent
 * @returns Promise resolving to HttpAgent with the specified identity
 */
export const createAgentWithIdentity = async (identity: Identity): Promise<HttpAgent> => {
  const host = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:8080';
  const agent = new HttpAgent({ 
    host,
    identity,
  });

  // Fetch root key only for local development
  // This MUST be awaited to prevent certificate verification errors
  if (process.env.DFX_NETWORK !== 'ic') {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn('Unable to fetch root key. Check local replica is running');
      console.error(err);
      throw err;
    }
  }

  return agent;
};

/**
 * Retrieves canister ID for a given canister name.
 * @param canisterName - Name of the canister (must match key in CANISTER_IDS)
 * @returns Canister ID string
 * @throws Error if canister ID not found
 */
export const getCanisterId = (canisterName: string): string => {
  const canisterId = CANISTER_IDS[canisterName as keyof typeof CANISTER_IDS];

  if (!canisterId) {
    throw new Error(
      `Canister ID not found for ${canisterName}. ` +
      `Make sure NEXT_PUBLIC_${canisterName.toUpperCase()}_CANISTER_ID is set.`
    );
  }

  return canisterId;
};

/**
 * Creates a typed actor instance for a canister.
 * Ensures agent is fully initialized (root key fetched) before creating actor.
 * 
 * @param canisterName - Name of the canister (must match key in CANISTER_IDS)
 * @param idlFactory - IDL factory from generated canister declarations
 * @param identity - Optional identity to use for the actor. If not provided, uses anonymous identity (backward compatible)
 * @returns Promise resolving to typed actor instance
 */
export const createActor = async <T = ActorSubclass<any>>(
  canisterName: string,
  idlFactory: IDL.InterfaceFactory,
  identity?: Identity | null
): Promise<T> => {
  const canisterId = getCanisterId(canisterName);

  // If identity is provided, create agent with that identity
  // Otherwise, use default agent (anonymous identity) for backward compatibility
  const agent = identity 
    ? await createAgentWithIdentity(identity)
    : await createAgent();

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  }) as T;
};

