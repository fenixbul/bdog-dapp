'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import { AccountBottomTab } from './AccountBottomTab';

/**
 * Account Navigation Component
 * 
 * Combines AccountBottomTab and Back to Home button
 * Used across all account-related pages (academy, rewards, profile, wallet)
 */
export function AccountNavigation() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <>
      {/* Back to Home Button - Absolute Position */}
      <Link 
        href="/" 
        className={`
          absolute top-1 left-2 z-50 lg:hidden
          flex flex-col items-center justify-center gap-1 
          px-3 py-2 rounded-md transition-all duration-200
          h-10 w-10 mt-[3px]
          ${
            isHome
              ? 'text-primary'
              : 'text-foreground'
          }
        `}
        aria-label="Back to home"
      >
        <div className="relative flex items-center justify-center">
          <Home className="w-5 h-5 flex-shrink-0" />
        </div>
      </Link>

      {/* Account Bottom Tab */}
      <AccountBottomTab />
    </>
  );
}

