import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Identity } from "@dfinity/agent";
import type { AuthClient } from "@dfinity/auth-client";
import { createAuthClient, getIdentityProviderUrl, initAuth } from '@/lib/auth/auth-utils';
import { principalToAccountIdentifier } from '@/lib/wallet/accountIdentifier';

export interface AuthStoreData {
  identity: Identity | undefined | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  principal: string | null;
  principalId: string | null;
  accountId: string | null;
  authClient: AuthClient | null;
}

export interface AuthStore extends AuthStoreData {
  // Actions
  sync: () => Promise<void>;
  signIn: (identityProviderUrl?: string, onError?: (error?: string) => void) => Promise<void>;
  signOut: () => Promise<void>;
  setPrincipal: (principal: string | null) => void;
  setAuthClient: (authClient: AuthClient | null) => void;
  // Modal control
  showConnectModal: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      identity: undefined,
      isInitialized: false,
      isAuthenticated: false,
      principal: null,
      principalId: null,
      accountId: null,
      authClient: null,
      showConnectModal: false,
      
      // Actions
      sync: async () => {
        try {
          const { authClient, isAuthenticated } = await initAuth();
          const identity = isAuthenticated ? authClient.getIdentity() : null;
          const principal = identity ? identity.getPrincipal().toText() : null;
          
          // Calculate principalId and accountId if authenticated
          let principalId = null;
          let accountId = null;
          if (identity) {
            const principalObj = identity.getPrincipal();
            principalId = principalObj.toString();
            accountId = principalToAccountIdentifier(principalObj);
          }
          
          set({
            authClient,
            identity,
            isAuthenticated,
            principal,
            principalId,
            accountId,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Auth sync failed:', error);
          set({
            identity: null,
            isAuthenticated: false,
            principal: null,
            principalId: null,
            accountId: null,
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
            maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1_000_000_000), // 1 week
            onSuccess: () => {
              const identity = client.getIdentity();
              const principal = identity ? identity.getPrincipal().toText() : null;
              
              // Calculate principalId and accountId
              let principalId = null;
              let accountId = null;
              if (identity) {
                const principalObj = identity.getPrincipal();
                principalId = principalObj.toString();
                accountId = principalToAccountIdentifier(principalObj);
              }
              
              set({
                authClient: client,
                identity,
                isAuthenticated: true,
                principal,
                principalId,
                accountId,
                showConnectModal: false, // Close modal on successful login
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
          principalId: null,
          accountId: null,
          authClient: null,
        });
      },

      setPrincipal: (principal) => set({ principal }),
      
      setAuthClient: (authClient) => set({ authClient }),
      
      openConnectModal: () => set({ showConnectModal: true }),
      
      closeConnectModal: () => set({ showConnectModal: false }),
    }),
    { name: 'auth-store' }
  )
);

