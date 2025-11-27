"use client";
import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { BdogStats } from './BdogStats';
import { BobMiningStats } from './BobMiningStats';
import { RefreshCw } from 'lucide-react';

type Tab = 'BDOG' | 'BOB_MINING';

export const StatsCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('BDOG');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 45000); // 45s auto-refresh

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate fetch
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="w-full h-full flex flex-col border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('BDOG')}
          className={clsx(
            "flex-1 py-4 text-sm md:text-base font-bold uppercase tracking-wider transition-colors relative",
            activeTab === 'BDOG' 
              ? "text-[hsl(158,100%,50%)] bg-primary/5" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/10"
          )}
        >
          $BDOG
          {activeTab === 'BDOG' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[hsl(158,100%,50%)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('BOB_MINING')}
          className={clsx(
            "flex-1 py-4 text-sm md:text-base font-bold uppercase tracking-wider transition-colors relative",
            activeTab === 'BOB_MINING' 
              ? "text-[hsl(158,100%,50%)] bg-primary/5" 
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/10"
          )}
        >
          $BOB
          {activeTab === 'BOB_MINING' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[hsl(158,100%,50%)]" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-hidden relative">
        {activeTab === 'BDOG' ? <BdogStats /> : <BobMiningStats />}
      </div>
    </div>
  );
};

