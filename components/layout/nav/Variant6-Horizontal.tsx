'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { navItems } from './nav-items';

/**
 * Variant 6: Horizontal Scrolling Tabs
 * 
 * UX Reasoning:
 * - Good for many navigation items
 * - Space-efficient design
 * - Modern mobile pattern with snap scrolling
 * - Scroll indicators show when more items are available
 * 
 * Pros:
 * + Handles many items gracefully
 * + Space-efficient
 * + Smooth scrolling with snap points
 * + Active tab auto-scrolls into view
 * 
 * Cons:
 * - Not all items visible at once
 * - Requires scrolling to see all options
 * - Less common pattern
 */

interface Variant6HorizontalProps {
  className?: string;
  activePath?: string;
}

export function Variant6Horizontal({ className = '', activePath }: Variant6HorizontalProps) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const currentPath = activePath || pathname;

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath?.startsWith(href);
  };

  // Check scroll position and update arrow visibility
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Scroll active item into view
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const activeIndex = navItems.findIndex((item) => isActive(item.href));
    if (activeIndex === -1) return;

    const container = scrollContainerRef.current;
    const activeElement = container.children[activeIndex] as HTMLElement;
    if (!activeElement) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = activeElement.getBoundingClientRect();

    // Scroll if element is outside visible area
    if (elementRect.left < containerRect.left) {
      container.scrollTo({
        left: activeElement.offsetLeft - container.offsetLeft - 16,
        behavior: 'smooth',
      });
    } else if (elementRect.right > containerRect.right) {
      container.scrollTo({
        left: activeElement.offsetLeft - container.offsetLeft - container.clientWidth + activeElement.offsetWidth + 16,
        behavior: 'smooth',
      });
    }
  }, [pathname, currentPath]);

  // Check scroll on mount and resize
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.75;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* Navigation Container */}
      <nav
        className={`
          fixed top-0 left-0 right-0 h-16 bg-background border-b border-border
          z-50 flex items-center
          ${className}
        `}
      >
        {/* Left Scroll Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex items-center justify-center w-12 h-full bg-background hover:bg-accent transition-colors z-10"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Scrollable Tabs Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide px-4 md:px-2"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
          onScroll={checkScroll}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md
                  transition-all duration-200 whitespace-nowrap
                  flex-shrink-0
                  scroll-snap-align: start
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
                style={{ scrollSnapAlign: 'start' }}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium text-sm md:text-base">{item.label}</span>
                {active && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-primary-foreground rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex items-center justify-center w-12 h-full bg-background hover:bg-accent transition-colors z-10"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}
      </nav>

      {/* Scroll Indicators (Mobile) */}
      <div className="md:hidden fixed top-16 left-0 right-0 h-1 bg-border z-40">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width: showRightArrow ? '50%' : '100%',
          }}
        />
      </div>

      {/* Content Spacer */}
      <div className="h-16" />
    </>
  );
}

