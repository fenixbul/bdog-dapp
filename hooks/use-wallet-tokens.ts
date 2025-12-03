import { useEffect, useMemo, useRef } from 'react';
import { HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore, type Token } from '@/store/wallet-store';
import { TokenService, DEFAULT_TOKENS } from '@/lib/token/tokenService';
import { useTokenData } from '@/providers/TokenDataProvider';

// Token colors for icons (using chart colors from tailwind config)
const TOKEN_COLORS = [
  'bg-chart-1', // hsl(220 70% 50%)
  'bg-chart-2', // hsl(160 60% 45%)
  'bg-chart-3', // hsl(30 80% 55%)
  'bg-chart-4', // hsl(280 65% 60%)
  'bg-chart-5', // hsl(340 75% 55%)
];

export function useWalletTokens() {
  const { identity, isAuthenticated } = useAuthStore();
  const { tokens, setTokens, setLoading } = useWalletStore();
  const { getTokenPrice, loading: tokenDataLoading, tokenData } = useTokenData();
  const hasInitialFetch = useRef(false);

  const tokenService = useMemo(() => {
    if (!identity) return null;
    
    const host = process.env.DFX_NETWORK === 'ic' // Always use icp0.io for now
      ? 'https://icp0.io' 
      : 'http://localhost:8080';
    
    const agent = new HttpAgent({ 
      identity,
      host,
    });
    
    // Only fetch root key for local development
    if (process.env.DFX_NETWORK !== 'ic') {
      agent.fetchRootKey().catch(console.error);
    }
    
    return new TokenService(agent);
  }, [identity]);

  const fetchTokens = async () => {
    if (!tokenService || !identity || !isAuthenticated) {
      setTokens([]);
      return;
    }

    setLoading(true);
    
    try {
      const principal = identity.getPrincipal();
      const tokenPromises = DEFAULT_TOKENS.map(async (canisterId, index) => {
        try {
          const [metadata, balanceData] = await Promise.all([
            tokenService.getTokenMetadata(canisterId),
            tokenService.getFormattedTokenBalance(canisterId, principal),
          ]);


          // Convert fee from atomic units to human-readable format
          const feeAtomic = metadata["icrc1:fee"] || BigInt(0);
          const feeFormatted = Number(feeAtomic) / Math.pow(10, metadata["icrc1:decimals"]);

          const token: Token = {
            id: canisterId,
            canisterId,
            icon: metadata["icrc1:logo"],
            symbol: metadata["icrc1:symbol"],
            name: metadata["icrc1:name"],
            balance: balanceData.formatted,
            price: getTokenPrice(canisterId) || 0,
            color: TOKEN_COLORS[index % TOKEN_COLORS.length],
            decimals: metadata["icrc1:decimals"],
            fee: feeFormatted,
          };

          return token;
        } catch (error) {
          console.error(`Error fetching token ${canisterId}:`, error);
          
          return null;
        }
      });

      const fetchedTokens = await Promise.all(tokenPromises);
      setTokens(fetchedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for token prices to finish loading (success or failure) before fetching tokens
    if (isAuthenticated && tokenService && !tokenDataLoading) {
      if (!hasInitialFetch.current) {
        hasInitialFetch.current = true;
        fetchTokens();
      }
    } else if (!isAuthenticated || !tokenService) {
      hasInitialFetch.current = false;
      setTokens([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, tokenService, tokenDataLoading]);

  // Update token prices when tokenData changes (after initial fetch)
  useEffect(() => {
    if (hasInitialFetch.current && tokens.length > 0 && tokenData.size > 0) {
      // Update prices in existing tokens without re-fetching from blockchain
      const updatedTokens = tokens.map(token => ({
        ...token,
        price: getTokenPrice(token.canisterId) || 0,
      }));
      setTokens(updatedTokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenData]);

  const isLoading = useWalletStore((state) => state.isLoading);

  return {
    tokens,
    isLoading,
    refreshTokens: fetchTokens,
    tokenService,
  };
}

