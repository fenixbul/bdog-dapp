"use client";

import type { Reward } from "@/store/rewards-store";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import { formatLargeNumber } from "@/lib/utils/common";

interface RewardItemProps {
  reward: Reward;
  onClaim: (id: string) => void;
}

export function RewardItem({ reward, onClaim }: RewardItemProps) {
  const Icon = reward.icon;

  // Get reward amount based on reward ID
  const getRewardAmount = (): string | null => {
    switch (reward.id) {
      case 'x-verification':
        // Format 20000 as "20 000" with space separator
        const formatted = formatLargeNumber(20000, 0);
        return `${formatted.replace(/,/g, ' ')} BDOG`;
      case 'academy-passed':
        return '10 BOB';
      default:
        return null;
    }
  };

  const rewardAmount = getRewardAmount();

  return (
    <div className="flex flex-col items-center justify-between p-4 border border-border bg-gradient-horizontal min-h-[140px] max-h-[220px] relative overflow-hidden">
      {/* Token Reward Badge */}
      {rewardAmount && (
        <div className="absolute top-2 right-2 bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded">
          {rewardAmount}
        </div>
      )}
      {/* Icon/Image */}
      <div className="flex items-center justify-center mb-2 flex-shrink-0">
        {reward.image ? (
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/20 flex-shrink-0 p-1">
            <Image
              src={reward.image}
              alt={reward.title}
              width={40}
              height={40}
              className="w-6 h-6 object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/20 flex-shrink-0">
            <Icon className="w-6 h-6 text-foreground" />
          </div>
        )}
      </div>

      {/* Title and Description */}
      <div className="flex flex-col items-center justify-center text-center min-w-0 mb-2 flex-shrink min-h-0 overflow-hidden">
        <h3 className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider">
          {reward.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {reward.description}
        </p>
      </div>

      {/* Claim Button */}
      <div className="flex-shrink-0 w-full">
        {reward.isClaimable && !reward.isClaimed ? (
          <Button
            onClick={() => onClaim(reward.id)}
            variant="primary"
            className="w-full text-xs uppercase tracking-wider"
            size="sm"
          >
            Claim
          </Button>
        ) : reward.isClaimed ? (
          <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">
            Claimed
          </div>
        ) : (
          <div className="text-xs text-muted-foreground uppercase tracking-wider text-center">
            Locked
          </div>
        )}
      </div>
    </div>
  );
}

