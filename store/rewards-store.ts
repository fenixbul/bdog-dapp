import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { CheckCircle2, GraduationCap, UserPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type RewardId = 'x-verification' | 'academy-passed' | 'refer-friend';

export interface Reward {
  id: RewardId;
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string; // For X verification, use X.png
  isClaimable: boolean;
  isClaimed: boolean;
}

export interface RewardsStore {
  rewards: Reward[];
  
  // Actions
  setRewardClaimed: (id: RewardId) => void;
  checkRewardEligibility: () => void;
  updateRewardEligibility: (id: RewardId, isClaimable: boolean) => void;
  getUnclaimedCount: () => number;
}

// Mock eligibility checkers (will be replaced with real logic later)
const checkXVerificationEligibility = (): boolean => {
  // Mock: Check localStorage or player provider
  // For now, return false (not verified)
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('x-verification-claimed') === 'true' ? false : true;
};

const checkAcademyEligibility = (): boolean => {
  // Mock: Check if academy reward was claimed
  if (typeof window === 'undefined') return false;
  const claimed = localStorage.getItem('academy-reward-claimed');
  return claimed === 'true' ? false : true;
};

const checkReferFriendEligibility = (): boolean => {
  // Mock: Always available for now
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('refer-friend-claimed') !== 'true';
};

const initialRewards: Reward[] = [
  {
    id: 'x-verification',
    title: 'X Verification',
    description: 'Verify your X account',
    icon: CheckCircle2,
    image: '/images/X.png',
    isClaimable: false,
    isClaimed: false,
  },
  {
    id: 'academy-passed',
    title: 'BOB Academy',
    description: 'Complete the academy',
    icon: GraduationCap,
    isClaimable: false,
    isClaimed: false,
  },
  {
    id: 'refer-friend',
    title: 'Refer a Friend',
    description: 'Invite someone to join',
    icon: UserPlus,
    isClaimable: false,
    isClaimed: false,
  },
];

export const useRewardsStore = create<RewardsStore>()(
  devtools(
    (set, get) => ({
      rewards: initialRewards.map(reward => ({
        ...reward,
        isClaimed: typeof window !== 'undefined' 
          ? localStorage.getItem(`${reward.id}-claimed`) === 'true'
          : false,
      })),
      
      checkRewardEligibility: () => {
        const rewards = get().rewards.map(reward => {
          let isClaimable = false;
          
          switch (reward.id) {
            case 'x-verification':
              isClaimable = checkXVerificationEligibility();
              break;
            case 'academy-passed':
              isClaimable = checkAcademyEligibility();
              break;
            case 'refer-friend':
              isClaimable = checkReferFriendEligibility();
              break;
          }
          
          return {
            ...reward,
            isClaimable: isClaimable && !reward.isClaimed,
          };
        });
        
        set({ rewards });
      },
      
      setRewardClaimed: (id) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${id}-claimed`, 'true');
        }
        
        const rewards = get().rewards.map(reward =>
          reward.id === id
            ? { ...reward, isClaimed: true, isClaimable: false }
            : reward
        );
        
        set({ rewards });
      },
      
      updateRewardEligibility: (id, isClaimable) => {
        const currentRewards = get().rewards;
        const reward = currentRewards.find(r => r.id === id);
        
        // Only update if the value actually changed
        if (reward && reward.isClaimable !== (isClaimable && !reward.isClaimed)) {
          const rewards = currentRewards.map(reward =>
            reward.id === id
              ? { ...reward, isClaimable: isClaimable && !reward.isClaimed }
              : reward
          );
          
          set({ rewards });
        }
      },
      
      getUnclaimedCount: () => {
        return get().rewards.filter(
          reward => reward.isClaimable && !reward.isClaimed
        ).length;
      },
    }),
    { name: 'rewards-store' }
  )
);

