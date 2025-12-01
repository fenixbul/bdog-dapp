'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { navItems } from './nav-items';

/**
 * Bottom Tab Bar (Mobile Only)
 * 
 * UX Reasoning:
 * - Excellent mobile UX (thumb-friendly navigation)
 * - Common in mobile-first applications
 * - Safe area padding for mobile devices with notches
 * - Horizontal scroll for ultra-low resolutions
 * 
 * Pros:
 * + Thumb-accessible on mobile
 * + Always visible, no hidden menus
 * + Familiar mobile app pattern
 * + Handles overflow gracefully
 * 
 * Cons:
 * - Takes up screen real estate
 */

interface BottomTabProps {
  className?: string;
  activePath?: string;
}

export function BottomTab({ className = '', activePath }: BottomTabProps) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  const currentPath = activePath || pathname;

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath?.startsWith(href);
  };

  // Scroll right handler
  const handleScrollRight = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of visible width
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Check if content overflows and show scroll indicator
  useEffect(() => {
    const checkOverflow = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const hasOverflow = container.scrollWidth > container.clientWidth;
        const isScrolledToEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
        setShowScrollIndicator(hasOverflow && !isScrolledToEnd);
      }
    };

    const handleScroll = () => {
      checkOverflow();
    };

    checkOverflow();
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', checkOverflow);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', checkOverflow);
    };
  }, []);

  return (
    <>
      {/* Mobile: Bottom Tab Bar */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 
          bg-background border-t border-border
          z-50
          ${className}
        `}
      >
        <div className="relative h-16 flex items-center">
          {/* Scrollable Navigation */}
          <nav
            ref={scrollContainerRef}
            className="flex items-center h-full overflow-x-auto scrollbar-hide w-full"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="flex items-center h-full justify-around min-w-full">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex flex-col items-center justify-center gap-1 
                      px-3 py-2 rounded-md transition-all duration-200
                      flex-1 min-w-[80px] max-w-[120px] flex-shrink-0 h-full
                      ${
                        active
                          ? 'text-primary'
                          : 'text-foreground'
                      }
                    `}
                  >
                    <div className="relative flex items-center justify-center">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight whitespace-nowrap">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Scroll Indicator Arrow */}
          {showScrollIndicator && (
            <button
              onClick={handleScrollRight}
              className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-2 pl-8 cursor-pointer bg-gradient-to-r from-transparent to-black hover:opacity-80 transition-opacity"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground animate-pulse flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Content Spacer for Mobile */}
      <div className="h-16" style={{ marginBottom: 'max(1rem, env(safe-area-inset-bottom))' }} />
    </>
  );
}

