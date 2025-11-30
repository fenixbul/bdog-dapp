import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { convertArrayToObject } from "@/lib/utils/common";
import type {
  IcrcTokenMetadata,
  TransferParams,
  ApproveParams,
} from "@dfinity/ledger-icrc";
import { ledgerStore } from "./ledgerStore";

/**
 * Interface for token metadata, extending the IcrcTokenMetadata from dfinity/ledger-icrc.
 */
export interface TokenMetadata extends IcrcTokenMetadata {
  totalSupply?: bigint;
  [key: string]: any;
}

import { ICP_CANISTER_ID, BDOG_CANISTER_ID, BOB_CANISTER_ID } from '@/lib/wallet/constants';

/**
 * Default tokens configuration.
 */
export const DEFAULT_TOKENS = [
  ICP_CANISTER_ID,
  BOB_CANISTER_ID,
  BDOG_CANISTER_ID,
];

/**
 * Converts a token value from atomic units to a human-readable number.
 * @param bigIntValue - The token value in atomic units.
 * @param decimals - The number of decimal places for the token.
 * @returns The value in human-readable format.
 */
export function convertTokenValueToNumber(
  bigIntValue: bigint,
  decimals: number
): number {
  const divisor = BigInt(Math.pow(10, decimals));
  return Number(bigIntValue) / Number(divisor);
}

/**
 * Helper function to ensure we always work with a Principal.
 */
function toPrincipal(id: string | Principal): Principal {
  return typeof id === "string" ? Principal.fromText(id) : id;
}

/**
 * TokenService encapsulates all token-related operations.
 */
export class TokenService {
  constructor(private agent: HttpAgent) {}

  /**
   * Checks if a token canister is available.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @returns A Promise resolving to true if the canister is available.
   */
  async isTokenCanisterAvailable(
    ledgerCanisterId: string | Principal
  ): Promise<boolean> {
    try {
      const canisterId = toPrincipal(ledgerCanisterId);
      const ledgerCanister = await ledgerStore.getCanister(
        this.agent,
        canisterId
      );
      const metadata = await ledgerCanister.metadata({});
      return metadata && metadata.length > 0;
    } catch (error) {
      console.warn("Token canister availability check failed:", error);
      return false;
    }
  }

  /**
   * Fetches the balance of a token for a specific principal.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @param owner - The principal ID of the token owner.
   * @param certified - Whether to request a certified response.
   * @returns A Promise resolving to the balance as a bigint.
   */
  async getTokenBalance(
    ledgerCanisterId: string | Principal,
    owner: Principal,
    certified: boolean = true
  ): Promise<bigint> {
    try {
      const canisterId = toPrincipal(ledgerCanisterId);
      const ledgerCanister = await ledgerStore.getCanister(
        this.agent,
        canisterId
      );
      return await ledgerCanister.balance({
        owner,
        certified,
      });
    } catch (error) {
      console.error("Error fetching token balance:", error);
      return BigInt(0); // Return 0 to make the app more resilient
    }
  }

  /**
   * Fetches the metadata of a token.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @returns A Promise resolving to the token metadata.
   */
  async getTokenMetadata(
    ledgerCanisterId: string | Principal
  ): Promise<TokenMetadata> {
    try {
      const canisterId = toPrincipal(ledgerCanisterId);
      const ledgerCanister = await ledgerStore.getCanister(
        this.agent,
        canisterId
      );
      const metadataArray = await ledgerCanister.metadata({});

      if (!metadataArray || metadataArray.length === 0) {
        return {
          name: "",
          symbol: "",
          decimals: 8,
          fee: BigInt(0),
        };
      }

      const metadataObject = convertArrayToObject(metadataArray);
      return {
        name: metadataObject.name || "",
        symbol: metadataObject.symbol || "",
        decimals: Number(metadataObject.decimals || 8),
        fee: BigInt(metadataObject.fee || 0),
        ...metadataObject,
      };
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      return {
        name: "",
        symbol: "",
        decimals: 8,
        fee: BigInt(0),
      };
    }
  }

  /**
   * Gets a human-readable token balance.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @param owner - The principal ID of the token owner.
   * @param certified - Whether to request a certified response.
   * @returns A Promise resolving to an object with the raw value and formatted balance.
   */
  async getFormattedTokenBalance(
    ledgerCanisterId: string | Principal,
    owner: Principal,
    certified: boolean = true
  ): Promise<{ value: bigint; formatted: number }> {
    const [balance, metadata] = await Promise.all([
      this.getTokenBalance(ledgerCanisterId, owner, certified),
      this.getTokenMetadata(ledgerCanisterId),
    ]);
    return {
      value: balance,
      formatted: convertTokenValueToNumber(balance, metadata.decimals),
    };
  }

  /**
   * Transfers tokens from the sender to the recipient.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @param params - Transfer parameters including to, amount, fee, memo, etc.
   * @returns A Promise resolving to the transfer result.
   */
  async transfer(
    ledgerCanisterId: string | Principal,
    params: TransferParams
  ): Promise<{ blockIndex: bigint }> {
    try {
      const canisterId = toPrincipal(ledgerCanisterId);
      const ledgerCanister = await ledgerStore.getCanister(
        this.agent,
        canisterId
      );

      // Perform the transfer
      const transferResult = await ledgerCanister.transfer(params);

      // transferResult is directly the block index (bigint)
      return { blockIndex: transferResult };
    } catch (error) {
      console.error("Error performing transfer:", error);
      throw error;
    }
  }

  /**
   * Approves a spender to spend tokens on behalf of the caller.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @param params - Approve parameters including spender, amount, fee, memo, etc.
   * @returns A Promise resolving to the approval result.
   */
  async approve(
    ledgerCanisterId: string | Principal,
    params: ApproveParams
  ): Promise<{ blockIndex: bigint }> {
    try {
      const canisterId = toPrincipal(ledgerCanisterId);
      const ledgerCanister = await ledgerStore.getCanister(
        this.agent,
        canisterId
      );

      // Perform the approval
      const approveResult = await ledgerCanister.approve(params);

      // approveResult is directly the block index (bigint)
      return { blockIndex: approveResult };
    } catch (error) {
      console.error("Error performing approval:", error);
      throw error;
    }
  }

  /**
   * Gets the allowance amount that a spender is approved to spend on behalf of the owner.
   * @param ledgerCanisterId - The canister ID of the token ledger.
   * @param owner - The principal ID of the token owner.
   * @param spender - The principal ID of the approved spender.
   * @param certified - Whether to request a certified response.
   * @returns A Promise resolving to the allowance as a bigint.
   */
  async getAllowance(
    ledgerCanisterId: string | Principal,
    owner: Principal,
    spender: Principal,
    certified: boolean = true
  ): Promise<bigint> {
    try {
      const canisterId = toPrincipal(ledgerCanisterId);
      const ledgerCanister = await ledgerStore.getCanister(
        this.agent,
        canisterId
      );

      const allowanceResult = await ledgerCanister.allowance({
        account: { owner, subaccount: [] },
        spender: { owner: spender, subaccount: [] },
        certified,
      });

      // Extract the allowance value from the result
      return allowanceResult.allowance;
    } catch (error) {
      console.error("Error fetching allowance:", error);
      return BigInt(0); // Return 0 to make the app more resilient
    }
  }
}
