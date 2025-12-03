'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

interface WalletOptionButtonProps {
  icon: string;
  label: string;
  description?: string;
  identityProviderUrl: string;
  onClick?: () => void;
}

export function WalletOptionButton({ icon, label, description, identityProviderUrl, onClick }: WalletOptionButtonProps) {
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
    <div
      className="flex flex-col bg-white text-black text-sm items-center gap-2 h-auto py-4 px-4 w-full"
      onClick={handleClick}
    >
      <Image src={icon} alt={label} width={40} height={40} />
      <span className="font-medium ">{label}</span>
      {description && (
        <span className="text-black/70 text-xs text-center leading-tight max-w-full break-words">
          {description}
        </span>
      )}
    </div>
  );
}

