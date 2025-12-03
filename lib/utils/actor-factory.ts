import { HttpAgent, Actor } from "@dfinity/agent";
import type { ActorSubclass } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

/**
 * Canister ID mapping from environment variables.
 * These are injected by dfx.webpack.config.js from canister_ids.json
 */
const CANISTER_IDS = {
  skill_module: process.env.NEXT_PUBLIC_SKILL_MODULE_CANISTER_ID,
} as const;

/**
 * Creates an HttpAgent with proper network configuration.
 * - Fetches root key for local development
 * - Uses appropriate host based on network
 */
export const createAgent = (): HttpAgent => {
  const host = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:8080';
  const agent = new HttpAgent({ host });

  // Fetch root key only for local development
  if (process.env.DFX_NETWORK !== 'ic') {
    agent.fetchRootKey().catch((err) => {
      console.warn('Unable to fetch root key. Check local replica is running');
      console.error(err);
    });
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
 * @param canisterName - Name of the canister (must match key in CANISTER_IDS)
 * @param idlFactory - IDL factory from generated canister declarations
 * @returns Typed actor instance
 */
export const createActor = <T = ActorSubclass<any>>(
  canisterName: string,
  idlFactory: IDL.InterfaceFactory
): T => {
  const agent = createAgent();
  const canisterId = getCanisterId(canisterName);

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  }) as T;
};

