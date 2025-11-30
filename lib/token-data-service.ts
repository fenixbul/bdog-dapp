"use client";

import { icexplorerService, type IcexplorerTokenData } from './icexplorer-service';
import { ICP_CANISTER_ID, BDOG_CANISTER_ID, BOB_CANISTER_ID } from './wallet/constants';

/**
 * Centralized service for managing ICP, BOB, and BDOG token data
 * Fetches from icexplorer API and syncs every 60 seconds
 */
class TokenDataService {
  private readonly TOKEN_IDS = [ICP_CANISTER_ID, BDOG_CANISTER_ID, BOB_CANISTER_ID] as const;
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Array<(data: IcexplorerTokenData) => void>> = new Map();
  private readonly CACHE_DURATION = 60000; // 60 seconds

  /**
   * Get token data for a specific ledger ID
   */
  async getTokenData(ledgerId: string): Promise<IcexplorerTokenData> {
    return icexplorerService.getData(ledgerId);
  }

  /**
   * Get token price for a specific ledger ID
   */
  async getTokenPrice(ledgerId: string): Promise<number> {
    const data = await this.getTokenData(ledgerId);
    return data.price;
  }

  /**
   * Subscribe to data updates for a specific ledgerId
   */
  subscribe(ledgerId: string, callback: (data: IcexplorerTokenData) => void): () => void {
    // Subscribe to icexplorer service updates
    const unsubscribe = icexplorerService.subscribe(ledgerId, callback);
    
    // Track subscribers for cleanup
    if (!this.subscribers.has(ledgerId)) {
      this.subscribers.set(ledgerId, []);
    }
    this.subscribers.get(ledgerId)!.push(callback);

    // Return combined unsubscribe function
    return () => {
      unsubscribe();
      const subs = this.subscribers.get(ledgerId);
      if (subs) {
        const index = subs.indexOf(callback);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  /**
   * Start auto-refresh for all tokens (ICP, BOB, BDOG)
   */
  startAutoRefresh(): void {
    if (this.updateInterval) {
      console.log('Token data service auto-refresh already running');
      return;
    }

    console.log('Starting token data service auto-refresh...');

    // Start auto-refresh for each token via icexplorer service
    this.TOKEN_IDS.forEach(ledgerId => {
      icexplorerService.startAutoRefresh(ledgerId);
    });

    // Set up interval to ensure all tokens refresh every 60 seconds
    this.updateInterval = setInterval(() => {
      // Trigger refresh for all tokens
      this.TOKEN_IDS.forEach(ledgerId => {
        icexplorerService.getData(ledgerId).catch(err => {
          console.error(`Failed to refresh token data for ${ledgerId}:`, err);
        });
      });
    }, this.CACHE_DURATION);
  }

  /**
   * Stop auto-refresh for all tokens
   */
  stopAutoRefresh(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Stop auto-refresh for each token
    this.TOKEN_IDS.forEach(ledgerId => {
      icexplorerService.stopAutoRefresh(ledgerId);
    });
  }

  /**
   * Get all tracked token IDs
   */
  getTokenIds(): readonly string[] {
    return this.TOKEN_IDS;
  }
}

// Singleton instance
export const tokenDataService = new TokenDataService();

