'use client';

import { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { ConnectWalletModal } from './ConnectWalletModal';

export function AuthButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const { isInitialized, isAuthenticated, signOut } = useAuthStore();

  if (!isInitialized) return null;

  if (isAuthenticated) {
    return (
      <Button variant="ghost" size="icon" onClick={signOut}>
        <LogOut className="h-5 w-5" />
        <span className="">Sign out</span>
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setModalOpen(true)}>
        <LogIn className="h-5 w-5" />
        <span className="">Sign in</span>
      </Button>
      <ConnectWalletModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

