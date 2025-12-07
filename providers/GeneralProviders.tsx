'use client';

import { type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui';
import { AuthProvider } from '@/providers/AuthProvider';
import { TokenDataProvider } from '@/providers/TokenDataProvider';
import { ActorServiceProvider } from '@/providers/ActorServiceProvider';
import { PlayerProvider } from '@/providers/PlayerProvider';
import { ResourcePreloader } from '@/components/ResourcePreloader';

interface GeneralProvidersProps {
  children: ReactNode;
}

export function GeneralProviders({ children }: GeneralProvidersProps) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <ActorServiceProvider>
          <PlayerProvider>
            <TokenDataProvider>
              <ResourcePreloader />
              {children}
            </TokenDataProvider>
          </PlayerProvider>
        </ActorServiceProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}

