'use client';

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { tokenDataService } from '@/lib/token-data-service';
import type { IcexplorerTokenData } from '@/lib/icexplorer-service';
import { ICP_CANISTER_ID, BDOG_CANISTER_ID, BOB_CANISTER_ID } from '@/lib/wallet/constants';

interface TokenDataContextValue {
  tokenData: Map<string, IcexplorerTokenData>;
  loading: boolean;
  error: string | null;
  getTokenData: (ledgerId: string) => IcexplorerTokenData | null;
  getTokenPrice: (ledgerId: string) => number | null;
}

const TokenDataContext = createContext<TokenDataContextValue | undefined>(undefined);

interface TokenDataProviderProps {
  children: ReactNode;
}

export function TokenDataProvider({ children }: TokenDataProviderProps) {
  const [tokenData, setTokenData] = useState<Map<string, IcexplorerTokenData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenIds = [ICP_CANISTER_ID, BDOG_CANISTER_ID, BOB_CANISTER_ID];
    const unsubscribes: Array<() => void> = [];

    // Initial fetch for all tokens
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all tokens in parallel
        const dataPromises = tokenIds.map(ledgerId => 
          tokenDataService.getTokenData(ledgerId).catch(err => {
            console.error(`Failed to fetch initial data for ${ledgerId}:`, err);
            return null;
          })
        );

        const results = await Promise.all(dataPromises);
        
        // Update state with fetched data
        const newTokenData = new Map<string, IcexplorerTokenData>();
        results.forEach((data, index) => {
          if (data) {
            newTokenData.set(tokenIds[index], data);
          }
        });

        setTokenData(newTokenData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch initial token data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load token data');
        setLoading(false);
      }
    };

    // Subscribe to updates for all tokens
    const setupSubscriptions = () => {
      tokenIds.forEach(ledgerId => {
        const unsubscribe = tokenDataService.subscribe(ledgerId, (newData: IcexplorerTokenData) => {
          setTokenData(prev => {
            const updated = new Map(prev);
            updated.set(ledgerId, newData);
            return updated;
          });
          setError(null);
        });
        unsubscribes.push(unsubscribe);
      });
    };

    // Start auto-refresh
    tokenDataService.startAutoRefresh();

    // Fetch initial data and setup subscriptions
    fetchInitialData();
    setupSubscriptions();

    // Cleanup
    return () => {
      tokenDataService.stopAutoRefresh();
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const getTokenData = (ledgerId: string): IcexplorerTokenData | null => {
    return tokenData.get(ledgerId) || null;
  };

  const getTokenPrice = (ledgerId: string): number | null => {
    const data = tokenData.get(ledgerId);
    return data ? data.price : null;
  };

  const value: TokenDataContextValue = {
    tokenData,
    loading,
    error,
    getTokenData,
    getTokenPrice,
  };

  return (
    <TokenDataContext.Provider value={value}>
      {children}
    </TokenDataContext.Provider>
  );
}

export function useTokenData(): TokenDataContextValue {
  const context = useContext(TokenDataContext);
  if (context === undefined) {
    throw new Error('useTokenData must be used within a TokenDataProvider');
  }
  return context;
}


