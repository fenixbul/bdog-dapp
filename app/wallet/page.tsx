'use client';

import { Wallet } from '@/components/wallet/wallet';
import { useAuthStore } from '@/store/auth-store';
import { AccessRequired } from '@/components/auth/AccessRequired';
import { AccountNavigation } from '@/components/layout/nav';

export default function WalletPage() {
  const { isInitialized, isAuthenticated } = useAuthStore();

  // Show loading while auth is initializing
  if (!isInitialized) {
    return null; // AuthProvider handles loading overlay
  }

  // Show access required message if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AccessRequired
          message="Please connect your wallet to access the wallet page."
        />
        <AccountNavigation />
      </>
    );
  }

  // Render wallet component when authenticated
  return (
    <>
      <Wallet />
      <AccountNavigation />
    </>
  );
}

