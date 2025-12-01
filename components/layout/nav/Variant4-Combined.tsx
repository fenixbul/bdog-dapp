'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { navItems } from './nav-items';

/**
 * Variant 4: Combined Top Bar + Sidebar
 * 
 * UX Reasoning:
 * - Best for complex applications with multiple navigation levels
 * - Top bar for primary actions/branding
 * - Sidebar for secondary navigation
 * - Two-level navigation hierarchy
 * 
 * Pros:
 * + Supports complex navigation structures
 * + Clear separation of primary/secondary actions
 * + Flexible layout for enterprise apps
 * 
 * Cons:
 * - More complex to implement
 * - Takes up both horizontal and vertical space
 * - May be overkill for simple apps
 */

interface Variant4CombinedProps {
  className?: string;
  activePath?: string;
  logo?: React.ReactNode;
  topBarItems?: typeof navItems;
  sidebarItems?: typeof navItems;
}

export function Variant4Combined({ 
  className = '', 
  activePath,
  logo = <span className="text-xl font-bold text-primary">Logo</span>,
  topBarItems = navItems.slice(0, 3), // First 3 items in top bar
  sidebarItems = navItems.slice(3), // Remaining items in sidebar
}: Variant4CombinedProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
          ${isSidebarCollapsed ? 'lg:left-16' : 'lg:left-60'}
          transition-all duration-300
          ${className}
        `}
      >
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            {logo}
          </Link>
        </div>

        {/* Desktop Top Bar Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {topBarItems.map((item) => {
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

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border
          transition-all duration-300 ease-in-out z-30
          ${isSidebarCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isSidebarCollapsed && (
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Navigation
            </h2>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${
                  isSidebarCollapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex flex-col p-2 gap-1 mt-4 overflow-y-auto">
          {sidebarItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md
                  transition-all duration-200
                  group relative
                  ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                `}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-foreground' : ''}`} />
                {!isSidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {/* Active Indicator */}
                {active && !isSidebarCollapsed && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                )}
                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-border z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Spacer */}
      <div
        className={`
          transition-all duration-300
          ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
          pt-16
        `}
      />
    </>
  );
}


