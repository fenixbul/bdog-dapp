'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoadingOverlay } from '@/components/layout/LoadingOverlay';
import { ConnectWalletModal } from './ConnectWalletModal';

interface AuthProviderProps {
  children: ReactNode;
}

// Protected routes that require authentication
// TODO: Good to have in future - make this configurable or load from config
const PROTECTED_ROUTES = ['/wallet'];

export function AuthProvider({ children }: AuthProviderProps) {
  const { sync, isInitialized, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const [showConnectModal, setShowConnectModal] = useState(false);

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
      setShowConnectModal(true);
    } else if (isAuthenticated) {
      setShowConnectModal(false);
    }
  }, [isInitialized, isAuthenticated, isProtectedRoute]);

  return (
    <>
      {/* Show loading overlay while auth is initializing */}
      {!isInitialized && <LoadingOverlay />}
      
      {/* Show ConnectWalletModal for protected routes when not authenticated */}
      {isInitialized && (
        <ConnectWalletModal 
          open={showConnectModal} 
          onOpenChange={setShowConnectModal} 
        />
      )}
      
      {children}
      
      {/* TODO: Good to have in future - Token state management in provider */}
      {/* TODO: To be implemented - Global loading states beyond auth */}
      {/* TODO: To be implemented - App context for other shared state */}
    </>
  );
}

