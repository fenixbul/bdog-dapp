'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { navItems } from './nav-items';

/**
 * Variant 2: Top Bar Navigation
 * 
 * UX Reasoning:
 * - Familiar pattern, widely recognized
 * - Good for content-focused applications
 * - Minimal vertical space usage
 * - Mobile: Hamburger menu opens drawer, logo remains visible
 * 
 * Pros:
 * + Doesn't take up horizontal space
 * + Logo/brand always visible
 * + Sticky positioning keeps nav accessible
 * 
 * Cons:
 * - Limited space for many nav items
 * - Requires drawer on mobile
 */

interface Variant2TopBarProps {
  className?: string;
  activePath?: string;
  logo?: React.ReactNode;
}

export function Variant2TopBar({ 
  className = '', 
  activePath,
  logo = <span className="text-xl font-bold text-primary">Logo</span>
}: Variant2TopBarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentPath = activePath || pathname;

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath?.startsWith(href);
  };

  return (
    <>
      {/* Top Bar */}
      <header
        className={`
          fixed top-0 left-0 right-0 h-16 bg-background border-b border-border
          z-50 flex items-center justify-between px-4 lg:px-6
          ${className}
        `}
      >
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {logo}
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-md
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-md hover:bg-accent text-foreground transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className={`
              lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] 
              bg-background border-l border-border z-50
              transform transition-transform duration-300 ease-out
              ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border h-16">
              <h2 className="text-lg font-bold text-foreground">Menu</h2>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-md hover:bg-accent text-foreground transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col p-4 gap-2 mt-4">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
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
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}

      {/* Content Spacer */}
      <div className="h-16" />
    </>
  );
}


