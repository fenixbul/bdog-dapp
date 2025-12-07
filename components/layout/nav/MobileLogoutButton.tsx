'use client';

import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Mobile Logout Button
 * 
 * Positioned at top-right, similar to Home button at top-left
 * Only visible on mobile when authenticated
 */
export function MobileLogoutButton() {
  const { isAuthenticated, signOut } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={signOut}
      className={`
        absolute top-1 right-2 z-50 lg:hidden
        flex flex-col items-center justify-center gap-1 
        px-3 py-2 rounded-md transition-all duration-200
        h-10 w-10
        text-foreground hover:bg-accent hover:text-accent-foreground
      `}
      aria-label="Logout"
    >
      <div className="relative flex items-center justify-center">
        <LogOut className="w-5 h-5 flex-shrink-0" />
      </div>
    </button>
  );
}


