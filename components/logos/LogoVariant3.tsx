'use client';

import React from 'react';

interface LogoVariant3Props {
  className?: string;
}

const LogoVariant3 = ({ className = '' }: LogoVariant3Props) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Background Badge */}
        <div className="bg-black px-8 py-3 transform -rotate-1">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-24 h-24 flex items-center justify-center ">
              <img 
                src="/images/BDOG.jpg" 
                alt="BOBDOG" 
                className="h-24 w-24 object-contain"
              />
            </div>
            
            {/* Text */}
            <div className="text-white text-left">
              <div className="text-xl font-bold tracking-wider">
                BOBDOG
              </div>
              {/* Symbol $BDOG */}
              <div className="text-sm font-bold tracking-wider opacity-60">$BDOG</div>
            </div>
          </div>
        </div>
        
        {/* Subtitle */}
        {/* <div className="text-center mt-3">
          <div className="text-sm italic text-gray-600 font-medium uppercase tracking-wide">
            "unite and build"
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default LogoVariant3;
