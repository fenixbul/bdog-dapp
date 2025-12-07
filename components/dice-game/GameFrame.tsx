'use client';

import { type ReactNode } from 'react';

interface GameFrameProps {
  children: ReactNode;
}

// TODO: Main wrapper (fullscreen mobile)
// - Full viewport container
// - Safe area handling (notches)
// - Prevent scroll/zoom
// - Mobile-first responsive
export function GameFrame({ children }: GameFrameProps) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* TODO: Safe area insets for mobile */}
      {/* TODO: Prevent default browser behaviors */}
      {children}
    </div>
  );
}



