import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Token {
  id: string;      // unique identifier (canister ID)
  icon: string;    // token icon URL
  symbol: string;  // e.g., "TKN"
  name: string;    // e.g., "Token Name"
  balance: number; // float
  price: number;   // USD price
  color: string;   // tailwind bg class for icon
  decimals: number; // token decimals
  canisterId: string; // canister ID for transfers
  fee: number;     // token fee in human-readable format
}

export interface WalletStore {
  tokens: Token[];
  isLoading: boolean;
  totalPortfolioValue: number;
  
  // Actions
  setTokens: (tokens: Token[]) => void;
  updateTokenBalance: (tokenId: string, balance: number) => void;
  setLoading: (loading: boolean) => void;
  calculateTotalValue: () => void;
}

export const useWalletStore = create<WalletStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      tokens: [],
      isLoading: false,
      totalPortfolioValue: 0,
      
      // Actions
      setTokens: (tokens) => {
        set({ tokens });
        get().calculateTotalValue();
      },
      
      updateTokenBalance: (tokenId, balance) => {
        const tokens = get().tokens.map(token =>
          token.id === tokenId ? { ...token, balance } : token
        );
        set({ tokens });
        get().calculateTotalValue();
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      calculateTotalValue: () => {
        const total = get().tokens.reduce((sum, token) => {
          return sum + (token.balance * token.price);
        }, 0);
        set({ totalPortfolioValue: total });
      },
    }),
    { name: 'wallet-store' }
  )
);

