'use client';

import { X } from 'lucide-react';
import type { Token } from '@/store/wallet-store';
import { TokenIcon } from './TokenIcon';

interface TokenSelectionScreenProps {
  title: string;
  tokens: Token[];
  onTokenSelect: (token: Token) => void;
  onClose: () => void;
}

export function TokenSelectionScreen({
  title,
  tokens,
  onTokenSelect,
  onClose,
}: TokenSelectionScreenProps) {
  return (
    <div className="p-6 max-h-[80vh] max-w-md mx-auto overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-wider">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {tokens.map((tokenOption) => (
          <button
            key={tokenOption.id}
            onClick={() => onTokenSelect(tokenOption)}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tokenOption.color} flex-shrink-0 p-1`}>
              <TokenIcon token={tokenOption} size={30} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">{tokenOption.symbol}</p>
              <p className="text-sm text-muted-foreground">{tokenOption.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

