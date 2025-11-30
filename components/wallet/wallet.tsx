'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { useWalletTokens } from '@/hooks/use-wallet-tokens';
import { useWalletStore, type Token } from '@/store/wallet-store';
import { TokenItem } from './TokenItem';
import { ActionModal } from './ActionModal';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/utils';

export function Wallet() {
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  
  const { tokens, isLoading, refreshTokens, tokenService } = useWalletTokens();
  const { totalPortfolioValue } = useWalletStore();

  const handleActionClick = (action: 'deposit' | 'withdraw') => {
    setSelectedAction(action);
    setSelectedToken(null);
    setActionModalOpen(true);
  };

  const handleTokenClick = (token: Token) => {
    setSelectedToken(token);
    setSelectedAction('withdraw');
    setActionModalOpen(true);
  };

  const handleModalClose = () => {
    setActionModalOpen(false);
    setSelectedToken(null);
  };

  const handleTransferSuccess = () => {
    refreshTokens();
  };

  return (
    <div className="min-h-screen flex justify-center bg-background">
      {/* App Container */}
      <div className="w-full max-w-md min-h-screen relative overflow-hidden shadow-xl bg-card">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 backdrop-blur-md border-b border-border bg-card/80">
          <div className="h-14 flex items-center justify-center">
            <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">
              Wallet
            </h1>
          </div>
        </header>

        {/* Header Balance Section */}
        <div className="pt-12 pb-8 px-6 text-center">
          <p className="text-4xl font-bold tracking-tight text-foreground">
            ${formatAmount(totalPortfolioValue)}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex justify-center gap-4 px-6 pb-6 relative">
          <button
            onClick={() => handleActionClick('deposit')}
            className="w-20 h-20 rounded-2xl shadow-lg flex flex-col items-center justify-center bg-primary text-primary-foreground active:scale-95 transition-transform duration-200"
            aria-label="Deposit"
          >
            <ArrowDown className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Deposit</span>
          </button>
          <button
            onClick={() => handleActionClick('withdraw')}
            className="w-20 h-20 rounded-2xl shadow-lg flex flex-col items-center justify-center bg-secondary text-secondary-foreground border border-border active:scale-95 transition-transform duration-200"
            aria-label="Withdraw"
          >
            <ArrowUp className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Withdraw</span>
          </button>
          <button
            onClick={refreshTokens}
            disabled={isLoading}
            className="absolute bottom-0 right-6 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-foreground active:scale-95 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh token balances"
            title="Refresh token balances"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Token List */}
        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading tokens...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tokens found</p>
            </div>
          ) : (
            <div>
              {tokens.map((token) => (
                <TokenItem
                  key={token.id}
                  token={token}
                  onClick={() => handleTokenClick(token)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Modal */}
        <ActionModal
          isOpen={actionModalOpen}
          onClose={handleModalClose}
          action={selectedAction}
          token={selectedToken}
          tokenService={tokenService}
          onSuccess={handleTransferSuccess}
        />
      </div>
    </div>
  );
}

