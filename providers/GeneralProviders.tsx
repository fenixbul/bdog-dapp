'use client';

import { type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui';
import { AuthProvider } from '@/providers/AuthProvider';
import { TokenDataProvider } from '@/providers/TokenDataProvider';
import { ActorServiceProvider } from '@/providers/ActorServiceProvider';
import { ResourcePreloader } from '@/components/ResourcePreloader';

interface GeneralProvidersProps {
  children: ReactNode;
}

export function GeneralProviders({ children }: GeneralProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <ActorServiceProvider>
          <TokenDataProvider>
            <ResourcePreloader />
            {children}
          </TokenDataProvider>
        </ActorServiceProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}

