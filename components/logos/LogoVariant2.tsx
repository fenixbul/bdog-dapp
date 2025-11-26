'use client';

import React from 'react';

interface LogoVariant2Props {
  className?: string;
}

const LogoVariant2 = ({ className = '' }: LogoVariant2Props) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Circular Logo Container */}
      <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 border-4 border-white shadow-lg flex items-center justify-center mb-3">
        <img 
          src="/images/logo.webp" 
          alt="BOBDOG" 
          className="w-14 h-14 object-contain filter brightness-0 invert"
        />
      </div>
      
      {/* Brand Text Stack */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          BOBDOG
        </div>
        <div className="text-sm text-gray-600 font-medium">
          The First Dog on BOBPAD
        </div>
        <div className="w-12 h-0.5 bg-black mx-auto mt-2"></div>
      </div>
    </div>
  );
};

export default LogoVariant2;

