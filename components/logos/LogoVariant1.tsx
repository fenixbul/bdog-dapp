'use client';

import React from 'react';

interface LogoVariant1Props {
  className?: string;
}

const LogoVariant1 = ({ className = '' }: LogoVariant1Props) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="bg-white border-2 border-gray-900 px-6 py-4 flex items-center gap-4">
        {/* Logo Image */}
        <div className="w-12 h-12 bg-black flex items-center justify-center">
          <img 
            src="/images/logo.webp" 
            alt="BOBDOG" 
            className="w-10 h-10 object-contain filter brightness-0 invert"
          />
        </div>
        
        {/* Brand Text */}
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            BOBDOG
          </div>
          <div className="text-xs text-gray-600 uppercase tracking-widest">
            First on BOBPAD
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoVariant1;

