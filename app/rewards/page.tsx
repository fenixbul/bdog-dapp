"use client";

import { useEffect } from "react";
import { AccountNavigation } from "@/components/layout/nav";
import { useRewardsStore } from "@/store/rewards-store";
import { RewardItem } from "@/components/rewards/RewardItem";
import { usePlayer } from "@/providers/PlayerProvider";
import { useAcademyProgress } from "@/hooks/use-academy-progress";

export default function RewardsPage() {
  const { rewards, setRewardClaimed, updateRewardEligibility } = useRewardsStore();
  const { player } = usePlayer();
  const { rewardClaimed: academyRewardClaimed } = useAcademyProgress();

  // Check eligibility on mount and when player/academy state changes
  useEffect(() => {
    // Update X verification eligibility based on player state
    if (player) {
      const isXVerified = player.is_x_verified ?? false;
      const isXClaimed = typeof window !== 'undefined' && localStorage.getItem('x-verification-claimed') === 'true';
      updateRewardEligibility('x-verification', isXVerified && !isXClaimed);
    }
    
    // Update Academy eligibility
    const isAcademyClaimed = typeof window !== 'undefined' && localStorage.getItem('academy-passed-claimed') === 'true';
    const academyPassed = academyRewardClaimed && !isAcademyClaimed;
    updateRewardEligibility('academy-passed', academyPassed);
    
    // Refer friend is always available (mock)
    const isReferClaimed = typeof window !== 'undefined' && localStorage.getItem('refer-friend-claimed') === 'true';
    updateRewardEligibility('refer-friend', !isReferClaimed);
  }, [updateRewardEligibility, player?.is_x_verified, academyRewardClaimed]);

  const handleClaim = (id: string) => {
    // Mock claim handler - just update the store
    setRewardClaimed(id as any);
    // In the future, this will call the backend canister
  };

  return (
    <>
      <div className="flex justify-center bg-background">
        {/* App Container */}
        <div className="w-full max-w-md relative overflow-hidden shadow-xl bg-card">
          {/* Sticky Header */}
          <header className="sticky top-0 z-10 backdrop-blur-md border-b border-border bg-card/80">
            <div className="h-14 flex items-center justify-center">
              <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">
                Rewards
              </h1>
            </div>
          </header>

          {/* Rewards Grid */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-120px)] overflow-y-auto">
              {rewards.map((reward) => (
                <RewardItem
                  key={reward.id}
                  reward={reward}
                  onClaim={handleClaim}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AccountNavigation />
    </>
  );
}
