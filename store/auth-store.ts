import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Identity } from "@dfinity/agent";
import type { AuthClient } from "@dfinity/auth-client";
import { createAuthClient, getIdentityProviderUrl, initAuth } from '@/lib/auth/auth-utils';

export interface AuthStoreData {
  identity: Identity | undefined | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  principal: string | null;
  authClient: AuthClient | null;
}

export interface AuthStore extends AuthStoreData {
  // Actions
  sync: () => Promise<void>;
  signIn: (identityProviderUrl?: string, onError?: (error?: string) => void) => Promise<void>;
  signOut: () => Promise<void>;
  setPrincipal: (principal: string | null) => void;
  setAuthClient: (authClient: AuthClient | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      identity: undefined,
      isInitialized: false,
      isAuthenticated: false,
      principal: null,
      authClient: null,
      
      // Actions
      sync: async () => {
        try {
          const { authClient, isAuthenticated } = await initAuth();
          const identity = isAuthenticated ? authClient.getIdentity() : null;
          const principal = identity ? identity.getPrincipal().toText() : null;
          
          set({
            authClient,
            identity,
            isAuthenticated,
            principal,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Auth sync failed:', error);
          set({
            identity: null,
            isAuthenticated: false,
            principal: null,
            isInitialized: true,
          });
        }
      },

      signIn: async (identityProviderUrl?: string, onError?: (error?: string) => void) => {
        try {
          const { authClient } = get();
          const client = authClient ?? (await createAuthClient());
          
          const providerUrl = identityProviderUrl || 
            (process.env.DFX_NETWORK === 'ic' ? 
            getIdentityProviderUrl() : 
            `http://${process.env.NEXT_PUBLIC_II_CANISTER_ID}.localhost:8080/#authorize`);
          
          await client.login({
            identityProvider: providerUrl,
            maxTimeToLive: BigInt(30 * 60 * 1_000_000_000), // 30 mins
            onSuccess: () => {
              const identity = client.getIdentity();
              const principal = identity ? identity.getPrincipal().toText() : null;
              
              set({
                authClient: client,
                identity,
                isAuthenticated: true,
                principal,
              });
            },
            onError,
          });
        } catch (e) {
          onError?.((e as Error).message);
        }
      },

      signOut: async () => {
        const { authClient } = get();
        if (!authClient) return; // Ensure the auth client is initialized
        
        await authClient.logout();
        // This fixes a "sign in -> sign out -> sign in again" flow without window reload.
        await initAuth();
        
        set({
          identity: null,
          isAuthenticated: false,
          principal: null,
          authClient: null,
        });
      },

      setPrincipal: (principal) => set({ principal }),
      
      setAuthClient: (authClient) => set({ authClient }),
    }),
    { name: 'auth-store' }
  )
);

