'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoadingOverlay } from '@/components/layout/LoadingOverlay';
import { ConnectWalletModal } from '@/components/auth/ConnectWalletModal';

interface AuthProviderProps {
  children: ReactNode;
}

// Protected routes that require authentication
// TODO: Good to have in future - make this configurable or load from config
const PROTECTED_ROUTES = ['/wallet'];

export function AuthProvider({ children }: AuthProviderProps) {
  const { sync, isInitialized, isAuthenticated, showConnectModal, closeConnectModal } = useAuthStore();
  const pathname = usePathname();

  // Sync auth on mount
  useEffect(() => {
    if (!isInitialized) {
      sync();
    }
  }, [sync, isInitialized]);

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));

  // Show ConnectWalletModal when accessing protected route and not authenticated
  // Close modal automatically when authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated && isProtectedRoute) {
      useAuthStore.getState().openConnectModal();
    } else if (isAuthenticated) {
      closeConnectModal();
    }
  }, [isInitialized, isAuthenticated, isProtectedRoute, closeConnectModal]);

  return (
    <>
      {/* Show loading overlay while auth is initializing */}
      {!isInitialized && <LoadingOverlay />}
      
      {/* Show ConnectWalletModal - can be triggered from any component via auth store */}
      {isInitialized && (
        <ConnectWalletModal 
          open={showConnectModal} 
          onOpenChange={(open) => {
            if (open) {
              useAuthStore.getState().openConnectModal();
            } else {
              closeConnectModal();
            }
          }} 
        />
      )}
      
      {children}
      
      {/* TODO: Good to have in future - Token state management in provider */}
      {/* TODO: To be implemented - Global loading states beyond auth */}
      {/* TODO: To be implemented - App context for other shared state */}
    </>
  );
}

