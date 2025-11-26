"use client";

import type { Candle } from './canisters/boblaunch.did.d.ts';

interface IcpPriceData {
  usd: string;
  icp: string;
}

interface IcpTokenData {
  price: IcpPriceData;
  fully_diluted_market_cap: {
    usd: number;
    icp: number;
  };
}

interface IcpApiResponse {
  metrics: IcpTokenData;
}

class PriceService {
  private icpPriceUSD: number = 0;
  private lastUpdate: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private subscribers: Array<(price: number) => void> = [];

  async fetchIcpPrice(): Promise<number> {
    try {
      const response = await fetch('https://web2.icptokens.net/api/tokens/ryjl3-tyaaa-aaaaa-aaaba-cai');
      const data: IcpApiResponse = await response.json();
      
      const icpPriceUSD = parseFloat(data.metrics.price.usd);
      this.icpPriceUSD = icpPriceUSD;
      this.lastUpdate = Date.now();
      
      // Notify all subscribers
      this.subscribers.forEach(callback => callback(icpPriceUSD));
      
      console.log('ICP price updated:', icpPriceUSD, 'USD');
      return icpPriceUSD;
    } catch (error) {
      console.error('Failed to fetch ICP price:', error);
      return this.icpPriceUSD; // Return cached price on error
    }
  }

  getIcpPriceUSD(): number {
    return this.icpPriceUSD;
  }

  isStale(): boolean {
    return Date.now() - this.lastUpdate > 60000; // 1 minute
  }

  subscribe(callback: (price: number) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  startAutoUpdate(): void {
    // Don't start if already running
    if (this.updateInterval) {
      console.log('Price service already running');
      return;
    }
    
    console.log('Starting price service...');
    // Initial fetch
    this.fetchIcpPrice();
    
    // Set up 1-minute interval
    this.updateInterval = setInterval(() => {
      this.fetchIcpPrice();
    }, 60000); // 60 seconds
  }

  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Find the most recent candle from candles array sorted by time
   * @param candles - Array of candles
   * @returns Most recent candle or null if array is empty
   */
  findLatestCandle(candles: Candle[]): Candle | null {
    if (!candles || candles.length === 0) {
      return null;
    }
    
    // Sort candles by time in descending order and return the first (most recent)
    const sortedCandles = [...candles].sort((a, b) => Number(b.time) - Number(a.time));
    return sortedCandles[0];
  }

  /**
   * Calculate market cap using new formula: (reserve_icp * icp_price) + (last_candle_close * 1000000000)
   * @param reserveIcp - Reserve ICP amount in e8s
   * @param icpPrice - Current ICP price in USD
   * @param lastCandleClose - Close price from most recent candle
   * @returns Market cap in USD
   */
  calculateMarketCapUSD(reserveIcp: bigint, icpPrice: number, lastCandleClose: number): number {
    const reserveIcpUSD = (Number(reserveIcp) / 1e8) * icpPrice;
    console.log('reserveIcpUSD', reserveIcpUSD);
    const candleValue = lastCandleClose * 1000000000;
    return reserveIcpUSD + candleValue;
  }
}

// Singleton instance
export const priceService = new PriceService();
