'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

interface WalletOptionButtonProps {
  icon: string;
  label: string;
  identityProviderUrl: string;
  onClick?: () => void;
}

export function WalletOptionButton({ icon, label, identityProviderUrl, onClick }: WalletOptionButtonProps) {
  const { signIn } = useAuthStore();

  const handleClick = () => {
    if (onClick) onClick();
    signIn(identityProviderUrl, (error) => {
      if (error) {
        console.error('Sign in error:', error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      className="flex flex-col items-center gap-3 h-auto py-6"
      onClick={handleClick}
    >
      <Image src={icon} alt={label} width={40} height={40} />
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}

