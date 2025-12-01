'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronLeft } from 'lucide-react';
import { navItems, type NavItem } from './nav-items';

/**
 * Collapsible Left Sidebar
 * 
 * UX Reasoning:
 * - Best for dashboards with many navigation items
 * - Saves horizontal space when collapsed (icon-only mode)
 * - Familiar desktop pattern, widely adopted
 * - Mobile: Hidden by default, accessible via hamburger menu
 * 
 * Pros:
 * + Maximizes content area when collapsed
 * + Persistent navigation visibility
 * + Tooltips on collapsed state maintain context
 * 
 * Cons:
 * - Takes vertical space on mobile
 * - Requires overlay pattern on mobile
 */

interface SidebarProps {
  className?: string;
  activePath?: string;
}

export function Sidebar({ className = '', activePath }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
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
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-md text-foreground hover:bg-accent transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>

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
          fixed left-0 top-0 h-full bg-background border-r border-border
          transition-all duration-300 ease-in-out z-30
          ${isCollapsed ? 'w-16' : 'w-60'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border h-16">
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-accent text-foreground transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                className={`w-5 h-5 transition-transform duration-300 ${
                  isCollapsed ? 'rotate-180' : ''
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

        {/* Navigation Items */}
        <nav className="flex flex-col p-2 gap-1 mt-4">
          {navItems.map((item) => {
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
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-foreground' : ''}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {/* Active Indicator */}
                {active && !isCollapsed && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                )}
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-border z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Spacer for Desktop */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-60'}`} />
    </>
  );
}

