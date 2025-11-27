'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WalletOptionButton } from './WalletOptionButton';

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({ open, onOpenChange }: ConnectWalletModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>Choose your Internet Identity provider</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <WalletOptionButton
            icon="/images/II_v1.svg"
            label="Internet Identity 1.0"
            identityProviderUrl="https://identity.ic0.app/"
          />
          <WalletOptionButton
            icon="/images/II_v2.svg"
            label="Internet Identity 2.0"
            identityProviderUrl="https://id.ai"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

