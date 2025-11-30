'use client';

import type { Token } from '@/store/wallet-store';
import { ICP_CANISTER_ID, BDOG_CANISTER_ID, BOB_CANISTER_ID } from '@/lib/wallet/constants';

interface TokenIconProps {
  token: Token;
  size?: number;
}

export function TokenIcon({ token, size = 30 }: TokenIconProps) {
  // Map specific token IDs to their local images
  let iconSrc = token.icon;
  
  if (token.id === ICP_CANISTER_ID) {
    iconSrc = '/images/icp_logo.png';
  } else if (token.id === BDOG_CANISTER_ID) {
    iconSrc = '/images/BDOG.jpg';
  } else if (token.id === BOB_CANISTER_ID) {
    iconSrc = '/images/bob_logo.png';
  }

  return (
    <div 
      className="w-[40px] h-[40px] flex items-center justify-center overflow-hidden flex-shrink-0 rounded-full"
    >
      <img
        src={iconSrc}
        alt={token.symbol}
        className="h-full w-auto"
      />
    </div>
  );
}

