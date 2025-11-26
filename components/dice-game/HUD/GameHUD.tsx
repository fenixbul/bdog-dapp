'use client';

import { type ReactNode } from 'react';

interface GameHUDProps {
  children: ReactNode;
}

// TODO: HUD container wrapper
// - Overlay UI positioned absolutely
// - Contains all HUD elements
export function GameHUD({ children }: GameHUDProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* TODO: HUD content */}
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

