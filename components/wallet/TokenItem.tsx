"use client";

import type { Token } from "@/store/wallet-store";
import { TokenIcon } from "./TokenIcon";
import { formatAmount } from "@/lib/utils";

interface TokenItemProps {
  token: Token;
  onClick: () => void;
}

export function TokenItem({ token, onClick }: TokenItemProps) {
  const usdValue = token.balance * token.price;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 border border-border mb-3 bg-card active:bg-accent transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Token Icon */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${token.color} flex-shrink-0 p-1`}
        >
          <TokenIcon token={token} size={30} />
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{token.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            $
            {usdValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0 ml-4">
        <p className="font-bold text-foreground">
          {formatAmount(token.balance)}
        </p>
        <p className="text-xs text-muted-foreground">{token.symbol}</p>
      </div>
    </div>
  );
}
