"use client";

// API Response Interface
interface IcexplorerApiResponse {
  statusCode: number;
  message: string | null;
  data: {
    ledgerId: string;
    name: string;
    symbol: string;
    tokenDecimal: number;
    fee: string;
    mintingAccount: string;
    totalSupply: string;
    supplyCap: string;
    tvl: string | null;
    description: string | null;
    logo: string;
    cycleBalance: string | null;
    memorySize: string | null;
    moduleHash: string | null;
    source: string;
    marketCap: string;
    fullyDilutedMarketCap: string;
    holderAmount: number;
    transactionAmount: number;
    price: string;
    priceChange24: string;
    txVolume24: string;
    priceICP: string;
    tokenDetail: {
      Telegram?: string;
      Website?: string;
      Twitter?: string;
      OpenChat?: string;
    } | null;
    standardArray: string[];
    controllerArray: string[] | null;
  };
}

// Service Data Interface
export interface IcexplorerTokenData {
  ledgerId: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  fullyDilutedMarketCap: number;
  holderAmount: number;
  transactionAmount: number;
  priceChange24: number;
  txVolume24: number;
  totalSupply: number;
  supplyCap: number;
  tokenDecimal: number;
}

// Holders API Response Interface
interface IcexplorerHoldersApiResponse {
  statusCode: number;
  message: string | null;
  data: {
    total: string;
    list: Array<{
      ledgerId: string;
      symbol: string;
      totalSupply: string;
      owner: string;
      subaccount: string;
      accountId: string;
      alias: string | null;
      amount: string;
      tokenDecimal: number;
      snapshotTime: number;
      valueUSD: string;
    }>;
    pageNum: number;
    pageSize: number;
    size: number;
    startRow: string;
    endRow: string;
    pages: number;
    prePage: number;
    nextPage: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    navigatePages: number;
    navigatepageNums: number[] | null;
    navigateFirstPage: number;
    navigateLastPage: number;
  };
}

// Holders Data Interface
export interface IcexplorerHolderData {
  ledgerId: string;
  symbol: string;
  totalSupply: number;
  owner: string;
  subaccount: string;
  accountId: string;
  alias: string | null;
  amount: number;
  tokenDecimal: number;
  snapshotTime: number;
  valueUSD: number;
}

export interface IcexplorerHoldersResponse {
  holders: IcexplorerHolderData[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
  hasNextPage: boolean;
}

// Cache entry interface
interface CacheEntry {
  data: IcexplorerTokenData;
  lastUpdate: number;
}

class IcexplorerService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, Array<(data: IcexplorerTokenData) => void>> = new Map();

  // API URLs
  private readonly API_URL = 'https://api.icexplorer.io/api/token/detail';
  private readonly HOLDERS_API_URL = 'https://api.icexplorer.io/api/holder/token';

  /**
   * Fetch token data from icexplorer API
   */
  private async fetchTokenData(ledgerId: string): Promise<IcexplorerTokenData> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ledgerId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: IcexplorerApiResponse = await response.json();

      if (apiResponse.statusCode !== 600 || !apiResponse.data) {
        throw new Error(`API error: ${apiResponse.message || 'Unknown error'}`);
      }

      const data = apiResponse.data;

      // Convert string values to numbers
      return {
        ledgerId: data.ledgerId,
        name: data.name,
        symbol: data.symbol,
        price: parseFloat(data.price),
        marketCap: parseFloat(data.marketCap),
        fullyDilutedMarketCap: parseFloat(data.fullyDilutedMarketCap),
        holderAmount: data.holderAmount,
        transactionAmount: data.transactionAmount,
        priceChange24: parseFloat(data.priceChange24),
        txVolume24: parseFloat(data.txVolume24),
        totalSupply: parseFloat(data.totalSupply),
        supplyCap: parseFloat(data.supplyCap),
        tokenDecimal: data.tokenDecimal,
      };
    } catch (error) {
      console.error(`Failed to fetch token data for ${ledgerId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached data or fetch new data if cache is stale
   */
  async getData(ledgerId: string): Promise<IcexplorerTokenData> {
    const now = Date.now();
    const cached = this.cache.get(ledgerId);

    // Return cached data if still fresh
    if (cached && (now - cached.lastUpdate) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Fetch fresh data
      const data = await this.fetchTokenData(ledgerId);

      // Update cache
      this.cache.set(ledgerId, {
        data,
        lastUpdate: now,
      });

      // Notify subscribers
      const subs = this.subscribers.get(ledgerId);
      if (subs) {
        subs.forEach(callback => callback(data));
      }

      return data;
    } catch (error) {
      console.error(`Failed to fetch token data for ${ledgerId}:`, error);

      // Return cached data if available, even if stale
      if (cached) {
        return cached.data;
      }

      // Re-throw error if no cached data available
      throw error;
    }
  }

  /**
   * Subscribe to data updates for a specific ledgerId
   */
  subscribe(ledgerId: string, callback: (data: IcexplorerTokenData) => void): () => void {
    if (!this.subscribers.has(ledgerId)) {
      this.subscribers.set(ledgerId, []);
    }

    const subs = this.subscribers.get(ledgerId)!;
    subs.push(callback);

    // Return unsubscribe function
    return () => {
      const index = subs.indexOf(callback);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }

  /**
   * Start auto-refresh with 60-second intervals for a specific ledgerId
   */
  startAutoRefresh(ledgerId: string): void {
    if (this.updateIntervals.has(ledgerId)) {
      console.log(`Auto-refresh already running for ${ledgerId}`);
      return;
    }

    console.log(`Starting auto-refresh for ${ledgerId}...`);

    // Initial fetch
    this.getData(ledgerId);

    // Set up 60-second interval
    const interval = setInterval(() => {
      this.getData(ledgerId);
    }, this.CACHE_DURATION);

    this.updateIntervals.set(ledgerId, interval);
  }

  /**
   * Stop auto-refresh for a specific ledgerId
   */
  stopAutoRefresh(ledgerId: string): void {
    const interval = this.updateIntervals.get(ledgerId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(ledgerId);
    }
  }

  /**
   * Check if cached data is stale for a specific ledgerId
   */
  isStale(ledgerId: string): boolean {
    const cached = this.cache.get(ledgerId);
    if (!cached) return true;
    return Date.now() - cached.lastUpdate > this.CACHE_DURATION;
  }

  /**
   * Clear cache for a specific ledgerId or all if no ledgerId provided
   */
  clearCache(ledgerId?: string): void {
    if (ledgerId) {
      this.cache.delete(ledgerId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Fetch holders data from icexplorer API
   */
  async getHolders(
    ledgerId: string,
    page: number = 1,
    size: number = 25,
    isDesc: boolean = true
  ): Promise<IcexplorerHoldersResponse> {
    try {
      const response = await fetch(this.HOLDERS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ledgerId, page, size, isDesc }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: IcexplorerHoldersApiResponse = await response.json();

      if (apiResponse.statusCode !== 600 || !apiResponse.data) {
        throw new Error(`API error: ${apiResponse.message || 'Unknown error'}`);
      }

      const data = apiResponse.data;

      // Convert string values to numbers and map to holder data
      const holders: IcexplorerHolderData[] = data.list.map(item => ({
        ledgerId: item.ledgerId,
        symbol: item.symbol,
        totalSupply: parseFloat(item.totalSupply),
        owner: item.owner,
        subaccount: item.subaccount,
        accountId: item.accountId,
        alias: item.alias,
        amount: parseFloat(item.amount),
        tokenDecimal: item.tokenDecimal,
        snapshotTime: item.snapshotTime,
        valueUSD: parseFloat(item.valueUSD),
      }));

      return {
        holders,
        total: parseInt(data.total),
        pageNum: data.pageNum,
        pageSize: data.pageSize,
        pages: data.pages,
        hasNextPage: data.hasNextPage,
      };
    } catch (error) {
      console.error(`Failed to fetch holders for ${ledgerId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const icexplorerService = new IcexplorerService();

