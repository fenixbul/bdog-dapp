'use client';

import React, { useState, useRef, useEffect } from 'react';
import { milestones, type Milestone } from '@/lib/timeline-data';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Globe, 
  Users, 
  Bot, 
  BarChart3, 
  TrendingUp 
} from 'lucide-react';
import { Footer } from './layout';

const MilestoneItem = ({ milestone, index }: { milestone: Milestone; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isGenesis = milestone.status === 'genesis';
  const isCurrent = milestone.status === 'current';
  const isFuture = milestone.status === 'future';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100);
        }
      },
      { threshold: 0.2 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  useEffect(() => {
    const updateContentHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }
    };

    updateContentHeight();
    window.addEventListener('resize', updateContentHeight);

    return () => window.removeEventListener('resize', updateContentHeight);
  }, [milestone.description]);

  const getDotStyles = () => {
    if (isGenesis) {
      return 'w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md ring-2 ring-yellow-200/50';
    }
    if (isCurrent) {
      return 'w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md ring-2 ring-blue-200/50 animate-pulse';
    }
    if (milestone.status === 'completed') {
      return 'w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 shadow-sm ring-1 ring-green-200/40';
    }
    return 'w-4 h-4 bg-muted-foreground/30 border border-muted-foreground/20';
  };

  const getMilestoneIcon = () => {
    switch (milestone.id) {
      case 'launch':
        return <Rocket className="w-4 h-4 text-white" />;
      case 'website-release':
        return <Globe className="w-4 h-4 text-white" />;
      case 'community-growth':
        return <Users className="w-4 h-4 text-white" />;
      case 'buy-bot-integration':
        return <Bot className="w-4 h-4 text-white" />;
      case 'holders-section':
        return <BarChart3 className="w-4 h-4 text-white" />;
      case 'market-cap-milestone':
        return <TrendingUp className="w-4 h-4 text-white" />;
      default:
        return null;
    }
  };

  // Function to render markdown-style bold text
  const renderDescription = (description: string) => {
    const parts = description.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      ref={itemRef}
      className={`
        relative flex items-start gap-4 transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Timeline line and dot */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        {/* Dot */}
        <div className={`
          relative rounded-full transition-all duration-300 z-10
          ${getDotStyles()}
        `}>
          {/* Milestone icons */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isGenesis ? (
              <div className="text-white text-xs font-bold">✦</div>
            ) : (
              getMilestoneIcon()
            )}
          </div>
        </div>
        
        {/* Connecting line - extends to next milestone */}
        {index < milestones.length - 1 && (
          <div className={`
            w-px mt-2 transition-all duration-700 ease-out origin-top
            ${isVisible ? 'bg-border scale-y-100' : 'bg-border scale-y-0'}
            ${isFuture ? 'bg-muted-foreground/20' : 'bg-border'}
          `} 
          style={{ 
            height: `${Math.max(contentHeight + 16, 64)}px`,
          }}
          />
        )}
      </div>
      
      {/* Content */}
      <div 
        ref={contentRef}
        className={`flex-1 min-w-0 pt-0.5 ${isFuture ? 'opacity-60' : ''} ${index < milestones.length - 1 ? 'pb-4' : 'pb-4'}`}
      >
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base sm:text-lg leading-tight flex-1">
              {milestone.title}
            </h3>
            <span className="text-xs sm:text-sm font-medium opacity-70 flex-shrink-0 pt-1">
              {milestone.date}
            </span>
          </div>
        </div>
        
        <p className="text-sm sm:text-base opacity-80 leading-relaxed">
          {renderDescription(milestone.description)}
        </p>
      </div>
    </div>
  );
};

const Timeline = () => {
  return (
    <div className="w-full bg-background" id="timeline">
      {/* Timeline content */}
      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
        <div className="relative">
          {milestones.map((milestone, index) => (
            <MilestoneItem key={milestone.id} milestone={milestone} index={index} />
          ))}
        </div>
        
        {/* Simple footer */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full" />
            <span className="italic">The journey continues...</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            We created $BDOG to back the <b>BOBPAD ecosystem</b>, taking inspiration from Dogecoin while focusing on practical use and community benefit - <span className="underline">not empty speculation</span>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Timeline;
