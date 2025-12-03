'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

interface WalletOptionButtonProps {
  icon: {
    src: string;
    width?: number;
    height?: number;
  }
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
    <button
      className="flex flex-col bg-white text-black text-sm items-center gap-2 h-auto py-4 px-4 w-full"
      onClick={handleClick}
    >
      <Image src={icon.src} alt={label} width={icon.width ?? 48} height={icon.height ?? 48} />
      <span className="font-medium ">{label}</span>
      {description && (
        <span className="text-black/70 font-medium normal-case text-xs text-center leading-tight max-w-full break-words">
          {description}
        </span>
      )}
    </button>
  );
}

