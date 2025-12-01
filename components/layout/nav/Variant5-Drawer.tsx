'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { navItems } from './nav-items';

/**
 * Variant 5: Off-Canvas Drawer
 * 
 * UX Reasoning:
 * - Modern mobile-first pattern
 * - Maximizes content space (minimal top bar)
 * - Drawer slides from left on desktop and mobile
 * - Backdrop overlay provides clear separation
 * 
 * Pros:
 * + Maximum content area
 * + Clean, minimal interface
 * + Smooth animations
 * + Auto-closes on route change
 * 
 * Cons:
 * - Navigation not always visible
 * - Requires extra click to access
 * - Less discoverable
 */

interface Variant5DrawerProps {
  className?: string;
  activePath?: string;
  logo?: React.ReactNode;
}

export function Variant5Drawer({ 
  className = '', 
  activePath,
  logo = <span className="text-xl font-bold text-primary">Logo</span>
}: Variant5DrawerProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentPath = activePath || pathname;

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath?.startsWith(href);
  };

  return (
    <>
      {/* Minimal Top Bar */}
      <header
        className={`
          fixed top-0 left-0 right-0 h-16 bg-background border-b border-border
          z-50 flex items-center justify-between px-4
          ${className}
        `}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          {logo}
        </Link>

        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md hover:bg-accent text-foreground transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] 
          bg-background border-r border-border z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-xl
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border h-16">
          <h2 className="text-lg font-bold text-foreground">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md hover:bg-accent text-foreground transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col p-4 gap-2 mt-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-md
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content Spacer */}
      <div className="h-16" />
    </>
  );
}


