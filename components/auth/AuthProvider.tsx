'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { sync, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      sync();
    }
  }, [sync, isInitialized]);

  return <>{children}</>;
}

