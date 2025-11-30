'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectWalletModal } from './ConnectWalletModal';

interface AccessRequiredProps {
  title?: string;
  message?: string;
  buttonText?: string;
}

export function AccessRequired({
  title = 'Access Required',
  message = 'Please connect your wallet to access this page.',
  buttonText = 'Connect Wallet',
}: AccessRequiredProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground">
              {message}
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowLoginModal(true)}
            className="w-full"
          >
            {buttonText}
          </Button>
        </div>
      </div>

      <ConnectWalletModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </>
  );
}

