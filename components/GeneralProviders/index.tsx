'use client';

import { type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { TokenDataProvider } from '@/contexts/TokenDataProvider';
import { ResourcePreloader } from '@/components/ResourcePreloader';

interface GeneralProvidersProps {
  children: ReactNode;
}

export function GeneralProviders({ children }: GeneralProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <TokenDataProvider>
          <ResourcePreloader />
          {children}
        </TokenDataProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}


