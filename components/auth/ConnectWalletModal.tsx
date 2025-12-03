"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletOptionButton } from "./WalletOptionButton";

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectWalletModal({
  open,
  onOpenChange,
}: ConnectWalletModalProps) {
  const internetIdentityUrl =
    process.env.DFX_NETWORK === "ic"
      ? "https://identity.ic0.app/"
      : `http://${process.env.NEXT_PUBLIC_INTERNET_IDENTITY_CANISTER_ID}.localhost:8080/#authorize`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <WalletOptionButton
            icon={{ src: "/images/II_v1.svg" }}
            label="Internet Identity"
            description="Standard ICP dapp login."
            identityProviderUrl={internetIdentityUrl}
          />
          <WalletOptionButton
            icon={{ src: "/images/web2-auth.jpg", width: 120, height: 48 }}
            label="Login with..."
            description="Google, Apple, or Microsoft."
            identityProviderUrl="https://id.ai"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
