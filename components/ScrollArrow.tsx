'use client';

import { useState } from 'react';

interface ScrollArrowProps {
  targetId: string;
  variant?: 'classic' | 'pulse' | 'minimal' | 'bold';
  className?: string;
}

const ScrollArrow = ({ targetId, variant = 'classic', className = '' }: ScrollArrowProps) => {
  const [isClicked, setIsClicked] = useState(false);

  const scrollToSection = () => {
    setIsClicked(true);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
    setTimeout(() => setIsClicked(false), 300);
  };

  const getArrowStyles = () => {
    const baseStyles = "scroll-arrow inline-flex items-center justify-center";
    
    switch (variant) {
      case 'classic':
        return `${baseStyles} w-12 h-12 bg-black text-white rounded-full bounce hover:bg-black`;
      
      case 'pulse':
        return `${baseStyles} w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full shadow-lg animate-pulse hover:from-yellow-500 hover:to-orange-600`;
      
      case 'minimal':
        return `${baseStyles} w-10 h-10 text-gray-600 hover:text-black`;
      
      case 'bold':
        return `${baseStyles} w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-purple-700`;
      
      default:
        return `${baseStyles} w-12 h-12 bg-black text-white rounded-full bounce`;
    }
  };

  const getArrowIcon = () => {
    switch (variant) {
      case 'minimal':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      
      case 'bold':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 16l-6-6h12l-6 6z" />
          </svg>
        );
      
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
    }
  };

  return (
    <button
      onClick={scrollToSection}
      className={`${getArrowStyles()} ${className} ${isClicked ? 'scale-95' : ''}`}
      aria-label="Scroll to next section"
    >
      {getArrowIcon()}
    </button>
  );
};

export default ScrollArrow;

