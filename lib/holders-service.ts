"use client";

import { getBoblaunchActor } from './actors';
import { formatTokenBalance, formatPercentage, formatHumanReadable } from './utils';
import type { Principal } from '@dfinity/principal';

export interface HolderData {
  principal: string;
  tokenBalance: bigint;
  percentage: number;
}

export interface HoldersServiceResponse {
  holders: HolderData[];
  totalSupply: bigint;
  error?: string;
}

class HoldersService {
  private cache: Map<string, { data: HoldersServiceResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Fetch top token holders for BDOG token (ID: 2908)
   * @param limit - Number of top holders to fetch (default: 10)
   * @returns Promise with holders data
   */
  async getTopHolders(limit: number = 10): Promise<HoldersServiceResponse> {
    const tokenId = 2908n; // Fixed token ID for BDOG
    const cacheKey = `${tokenId}-${limit}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const actor = getBoblaunchActor();
      
      // Fetch token data from boblaunch canister
      const tokenData = await actor.get_token_data(tokenId);
      
      const totalSupply = tokenData.liquidity_pool.total_supply;
      
      // Process top holders data - limit to requested number
      const topHolders = tokenData.top_holders.slice(0, limit);
      const holders: HolderData[] = topHolders.map(([principal, balance]) => {
        const tokenBalance = balance;
        const percentage = totalSupply > 0n 
          ? Number((tokenBalance * 10000n) / totalSupply) / 100 // Calculate percentage with 2 decimal precision
          : 0;

          console.log(principal.toText())

        return {
          principal: principal.toString(),
          tokenBalance,
          percentage,
        };
      });

      const result: HoldersServiceResponse = {
        holders,
        totalSupply,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Failed to fetch holders:', error);
      return {
        holders: [],
        totalSupply: 0n,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Format principal for display (truncate with ellipsis)
   * @param principal - The principal string
   * @param length - Number of characters to show from start and end
   * @returns Formatted principal string
   */
  formatPrincipal(principal: string, length: number = 6): string {
    if (principal.length <= length * 2) {
      return principal;
    }
    return `${principal.slice(0, length)}...${principal.slice(-length)}`;
  }

  /**
   * Format token balance for display with K/M notation and spacing
   * @param balance - Token balance as bigint
   * @param decimals - Token decimals (default: 8)
   * @param useKM - Whether to use K/M notation for large numbers
   * @returns Formatted balance string
   */
  formatTokenBalance(balance: bigint, decimals: number = 8, useKM: boolean = true): string {
    return formatTokenBalance(balance, decimals, {
      showDecimals: true,
      useKM,
      maxValue: 100000
    });
  }

  /**
   * Format total supply with proper spacing and K/M notation
   * @param supply - Total supply as bigint
   * @param decimals - Token decimals (default: 8)
   * @returns Formatted supply string
   */
  formatTotalSupply(supply: bigint, decimals: number = 8): string {
    return formatTokenBalance(supply, decimals, {
      showDecimals: false,
      useKM: false, // Always show full numbers with spacing for supply
      maxValue: Infinity
    });
  }

  /**
   * Format percentage with appropriate precision
   * @param percentage - Percentage value
   * @returns Formatted percentage string
   */
  formatPercentage(percentage: number): string {
    return formatPercentage(percentage, { showSymbol: true });
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const holdersService = new HoldersService();
