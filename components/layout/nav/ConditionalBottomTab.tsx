'use client';

import { usePathname } from 'next/navigation';
import { BottomTab } from './BottomTab';

/**
 * Conditionally renders BottomTab, hiding it on account pages
 * where AccountNavigation should be shown instead
 */
export function ConditionalBottomTab() {
  const pathname = usePathname();
  
  // Hide BottomTab on account pages
  const accountPages = ['/profile', '/rewards', '/wallet', '/academy'];
  const shouldHide = accountPages.some(page => pathname?.startsWith(page));
  
  if (shouldHide) {
    return null;
  }
  
  return <BottomTab />;
}

