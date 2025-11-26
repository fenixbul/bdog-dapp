export type MilestoneStatus = 'genesis' | 'completed' | 'current' | 'future';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: MilestoneStatus;
  details?: string[];
  icon?: string;
  category?: string;
}

export const milestones: Milestone[] = [
  {
    id: 'launch',
    title: 'Launch',
    description: 'BOBDOG goes live on **bobpad.fun** as the first bonded meme project. Fully bonded in under 24 hours.',
    date: '11 Aug 2025',
    status: 'genesis'
  },
  {
    id: 'website-release',
    title: 'Website Release',
    description: 'Official site launches with **live market data**, project details, and clean design.',
    date: '12 Aug 2025',
    status: 'completed'
  },
  {
    id: 'community-growth',
    title: 'Community Growth',
    description: '**Telegram HQ** opens for early supporters and builders.',
    date: '13 Aug 2025',
    status: 'completed'
  },
  {
    id: 'buy-bot-integration',
    title: 'BortyBuyBot Integration',
    description: '**Real-time buy bot** goes live, bringing transparency and energy to every trade.',
    date: '15 Aug 2025',
    status: 'completed'
  },
  {
    id: 'holders-section',
    title: 'Holders Section',
    description: 'New section on the site showcasing **holder stats** in real time.',
    date: '15 Aug 2025',
    status: 'current'
  }
];

export const getMilestonesByStatus = (status: MilestoneStatus) => {
  return milestones.filter(milestone => milestone.status === status);
};

export const getCompletedMilestones = () => {
  return milestones.filter(milestone => milestone.status === 'completed' || milestone.status === 'genesis');
};

export const getCurrentMilestone = () => {
  return milestones.find(milestone => milestone.status === 'current');
};

export const getFutureMilestones = () => {
  return milestones.filter(milestone => milestone.status === 'future');
};
