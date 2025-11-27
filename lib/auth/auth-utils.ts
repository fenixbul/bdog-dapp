import { AuthClient } from "@dfinity/auth-client";
import type { Identity } from "@dfinity/agent";

/**
 * Create and configure an AuthClient instance.
 * Disables idle timeout (to support multi-tab UX).
 */
export const createAuthClient = (): Promise<AuthClient> =>
  AuthClient.create({
    idleOptions: {
      disableIdle: true,
      disableDefaultIdleCallback: true,
    },
  });

/**
 * Checks if identity is defined (authenticated).
 */
export const isSignedIn = (identity: Identity | undefined | null): boolean =>
  identity !== undefined && identity !== null;

/**
 * Attempts to restore identity from previous session.
 */
export const loadIdentity = async (): Promise<Identity | undefined> => {
  const authClient = await createAuthClient();
  const authenticated = await authClient.isAuthenticated();

  if (!authenticated) return undefined;

  return authClient.getIdentity();
};

/**
 * Returns the identity provider URL.
 * Uses https://id.ai as specified.
 */
export const getIdentityProviderUrl = (): string => {
  return "https://id.ai";
  // TODO: Future - support other providers based on environment
  // if (location.host.endsWith(".ic0.app")) {
  //   return "https://identity.internetcomputer.org"; // Old mainnet identity
  // }
  // return "https://identity.ic0.app"; // Default provider
};

/**
 * Initialize auth client and check authentication status.
 * This is used in the logout flow to reinitialize after logout.
 */
export const initAuth = async (): Promise<{ authClient: AuthClient; isAuthenticated: boolean }> => {
  const authClient = await createAuthClient();
  const isAuthenticated = await authClient.isAuthenticated();
  
  return { authClient, isAuthenticated };
};

