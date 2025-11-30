"use client";

import { getBobminingActor, getBobledgerActor } from './actors';
import type { Stats } from './canisters/bobmining.did.d.ts';
import { tokenDataService } from './token-data-service';
import { BOB_CANISTER_ID } from './wallet/constants';

// API Response Interfaces
interface CycleBurnRateResponse {
  cycle_burn_rate: [string, string][];
}

interface XtcPriceResponse {
  success: boolean;
  rates: {
    USD: number;
  };
}

// Service Data Interfaces
export interface BobMiningData {
  // Essential Display Information
  bobPrice: number;
  bobMarketCap: number;
  bobCyclesBurnRateUSD: number; // Daily burn rate in USD
  bobIndex: number;
  blockRewards: number;
  
  // Legacy fields (for backward compatibility)
  cycleBurnedPerDay: number;
  totalMiners: number;
  totalBlocksMined: number;
  nextHalving: number;
  blockSpeed: number; // Always 7 minutes
  totalSupply: number;
  bobMinedPercentage: number;
  
  // Raw data for debugging
  bobSubnetBurnRate: number;
  networkBurnRate: number;
  xtcPriceUSD: number;
  miningStats: Stats | null;
}

class BobMiningService {
  private cache: BobMiningData | null = null;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(data: BobMiningData) => void> = [];

  // Constants
  private readonly BOB_MAX_SUPPLY = 21000000; // 21 million BOB tokens

  // API URLs
  private readonly BOB_SUBNET_URL = 'https://ic-api.internetcomputer.org/api/v3/metrics/cycle-burn-rate?subnet=bkfrj-6k62g-dycql-7h53p-atvkj-zg4to-gaogh-netha-ptybj-ntsgw-rqe';
  private readonly NETWORK_BURN_URL = 'https://ic-api.internetcomputer.org/api/v3/metrics/cycle-burn-rate';
  private readonly XTC_PRICE_URL = 'https://api.fxratesapi.com/latest?base=XDR&currencies=USD';

  /**
   * Fetch BOB subnet cycle burn rate
   */
  private async fetchBobSubnetBurnRate(): Promise<number> {
    try {
      const response = await fetch(this.BOB_SUBNET_URL);
      const data: CycleBurnRateResponse = await response.json();
      
      if (data.cycle_burn_rate && data.cycle_burn_rate.length > 0) {
        return parseFloat(data.cycle_burn_rate[0][1]);
      }
      throw new Error('BOB subnet burn rate not available');
    } catch (error) {
      console.error('Failed to fetch BOB subnet burn rate:', error);
      throw error;
    }
  }

  /**
   * Fetch network-wide cycle burn rate
   */
  private async fetchNetworkBurnRate(): Promise<number> {
    try {
      const response = await fetch(this.NETWORK_BURN_URL);
      const data: CycleBurnRateResponse = await response.json();
      
      if (data.cycle_burn_rate && data.cycle_burn_rate.length > 0) {
        return parseFloat(data.cycle_burn_rate[0][1]);
      }
      throw new Error('Network burn rate not available');
    } catch (error) {
      console.error('Failed to fetch network burn rate:', error);
      throw error;
    }
  }

  /**
   * Fetch XTC to USD price (1T cycles = 1 XDR)
   */
  private async fetchXtcPrice(): Promise<number> {
    try {
      const response = await fetch(this.XTC_PRICE_URL);
      const data: XtcPriceResponse = await response.json();
      
      if (data.success && data.rates.USD) {
        return data.rates.USD;
      }
      throw new Error('XTC price not available');
    } catch (error) {
      console.error('Failed to fetch XTC price:', error);
      throw error;
    }
  }

  /**
   * Fetch BOB token price from TokenDataService
   */
  private async fetchBobPrice(): Promise<number> {
    try {
      const price = await tokenDataService.getTokenPrice(BOB_CANISTER_ID);
      if (price === null || price === undefined) {
        throw new Error('BOB price not available from TokenDataService');
      }
      return price;
    } catch (error) {
      console.error('Failed to fetch BOB price:', error);
      throw error;
    }
  }

  /**
   * Fetch mining statistics from BOB mining canister
   */
  private async fetchMiningStats(): Promise<Stats | null> {
    try {
      const actor = getBobminingActor();
      const stats = await actor.get_statistics();
      return stats;
    } catch (error) {
      console.error('Failed to fetch mining stats:', error);
      return null;
    }
  }

  /**
   * Fetch total supply from BOB ledger canister
   */
  private async fetchTotalSupply(): Promise<number> {
    try {
      const actor = getBobledgerActor();
      const totalSupply = await actor.icrc1_total_supply();
      // Convert from e8s to BOB tokens (divide by 100,000,000)
      return Number(totalSupply) / 100000000;
    } catch (error) {
      console.error('Failed to fetch total supply:', error);
      throw error;
    }
  }

  /**
   * Calculate BOB index (percentage of all ICP cycle burns attributed to BOB mining)
   */
  private calculateBobIndex(bobBurnRate: number, networkBurnRate: number): number {
    if (networkBurnRate === 0) return 0;
    return (bobBurnRate / networkBurnRate) * 100;
  }

  /**
   * Calculate daily cycle burns in USD (BOB subnet rate * 86400 seconds * XTC price / 1T cycles)
   */
  private calculateDailyCycleBurnsUSD(bobBurnRate: number, xtcPrice: number): number {
    const dailyBurns = bobBurnRate * 86400; // 24 hours * 60 minutes * 60 seconds
    const dailyBurnsInTrillions = dailyBurns / 1000000000000; // Convert to trillions (1T cycles = 1 XDR)
    return dailyBurnsInTrillions * xtcPrice; // Convert to USD
  }

  /**
   * Calculate BOB market cap (BOB price * total supply)
   */
  private calculateMarketCap(bobPrice: number, totalSupply: number): number {
    return bobPrice * totalSupply;
  }

  /**
   * Calculate block rewards based on halving count
   */
  private calculateBlockRewards(halvingCount: bigint): number {
    const halvings = Number(halvingCount);
    return Math.trunc(600 / Math.pow(2, halvings));
  }

  /**
   * Calculate blocks until next halving
   */
  private calculateNextHalving(blockCount: bigint): number {
    const blocks = Number(blockCount);
    const halvingInterval = 17500;
    const nextHalvingBlock = Math.ceil((blocks + 1) / halvingInterval) * halvingInterval;
    return nextHalvingBlock - blocks;
  }

  /**
   * Calculate percentage of BOB tokens that have been mined
   */
  private calculateBobMinedPercentage(totalSupply: number): number {
    if (totalSupply === 0) return 0;
    return (totalSupply / this.BOB_MAX_SUPPLY) * 100;
  }

  /**
   * Fetch all data and calculate metrics
   */
  private async fetchAllData(): Promise<BobMiningData> {
    // Fetch all data in parallel
    const [
      bobSubnetBurnRate,
      networkBurnRate,
      xtcPriceUSD,
      bobPrice,
      miningStats,
      totalSupply
    ] = await Promise.all([
      this.fetchBobSubnetBurnRate(),
      this.fetchNetworkBurnRate(),
      this.fetchXtcPrice(),
      this.fetchBobPrice(),
      this.fetchMiningStats(),
      this.fetchTotalSupply()
    ]);

    // Calculate metrics
    const bobIndex = this.calculateBobIndex(bobSubnetBurnRate, networkBurnRate);
    const cycleBurnedPerDay = this.calculateDailyCycleBurnsUSD(bobSubnetBurnRate, xtcPriceUSD); // Legacy field
    const bobCyclesBurnRateUSD = this.calculateDailyCycleBurnsUSD(bobSubnetBurnRate, xtcPriceUSD);
    const bobMarketCap = this.calculateMarketCap(bobPrice, totalSupply);
    const bobMinedPercentage = this.calculateBobMinedPercentage(totalSupply);
    
    let blockRewards = 0;
    let nextHalving = 0;
    let totalMiners = 0;
    let totalBlocksMined = 0;

    if (miningStats) {
      blockRewards = this.calculateBlockRewards(miningStats.halving_count);
      nextHalving = this.calculateNextHalving(miningStats.block_count);
      totalMiners = Number(miningStats.miner_count);
      totalBlocksMined = Number(miningStats.block_count);
    }

    return {
      // Essential Display Information
      bobPrice,
      bobMarketCap,
      bobCyclesBurnRateUSD,
      bobIndex,
      blockRewards,
      
      // Legacy fields (for backward compatibility)
      cycleBurnedPerDay,
      totalMiners,
      totalBlocksMined,
      nextHalving,
      blockSpeed: 7, // Always 7 minutes as specified
      totalSupply,
      bobMinedPercentage,
      
      // Raw data for debugging
      bobSubnetBurnRate,
      networkBurnRate,
      xtcPriceUSD,
      miningStats
    };
  }

  /**
   * Get cached data or fetch new data if cache is stale
   */
  async getData(): Promise<BobMiningData> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cache && (now - this.lastUpdate) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      // Fetch fresh data
      const data = await this.fetchAllData();
      
      // Update cache
      this.cache = data;
      this.lastUpdate = now;
      
      // Notify subscribers
      this.subscribers.forEach(callback => callback(data));
      
      return data;
    } catch (error) {
      console.error('Failed to fetch mining data:', error);
      
      // Return cached data if available, otherwise return default values
      if (this.cache) {
        return this.cache;
      }
      
      // Re-throw error if no cached data available
      throw error;
    }
  }

  /**
   * Subscribe to data updates
   */
  subscribe(callback: (data: BobMiningData) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Start auto-refresh with 60-second intervals
   */
  startAutoRefresh(): void {
    if (this.updateInterval) {
      console.log('BOB mining service already running');
      return;
    }
    
    console.log('Starting BOB mining service...');
    
    // Initial fetch
    this.getData();
    
    // Set up 60-second interval
    this.updateInterval = setInterval(() => {
      this.getData();
    }, this.CACHE_DURATION);
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Check if cached data is stale
   */
  isStale(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION;
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.lastUpdate = 0;
  }
}

// Singleton instance
export const bobMiningService = new BobMiningService();
