'use client';

import { AccountNavigation } from '@/components/layout/nav';
import { ProfileCard } from '@/components/profile';

export default function ProfilePage() {
  return (
    <>
      <div className="min-h-screen p-4 flex items-start justify-center pt-8">
        <ProfileCard />
      </div>
      
      <AccountNavigation />
    </>
  );
}

