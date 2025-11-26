"use client";
import React, { useState, useEffect } from 'react';
import { bobMiningService, type BobMiningData } from '@/lib/bob-mining-service';
import { 
  DollarSign, 
  TrendingUp, 
  Coins,
  BarChart3,
  Activity
} from 'lucide-react';

export const BobMiningStats: React.FC = () => {
  const [data, setData] = useState<BobMiningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMiningData();
    
    // Start auto-refresh service
    bobMiningService.startAutoRefresh();
    
    // Subscribe to updates
    const unsubscribe = bobMiningService.subscribe((newData: BobMiningData) => {
      setData(newData);
      setError(null);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      bobMiningService.stopAutoRefresh();
    };
  }, []);

  const fetchMiningData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const miningData = await bobMiningService.getData();
      setData(miningData);
    } catch (err) {
      console.error('Failed to fetch mining data:', err);
      setError('Failed to load mining data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(4)}`;
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatDailyBurn = (amount: number): string => {
    return `$${amount.toFixed(0)}/day`;
  };

  if (loading || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(158,100%,50%)] mb-4"></div>
        <p className="text-gray-400 text-sm">Loading BOB mining data...</p>
        <p className="text-gray-500 text-xs mt-2">Fetching real-time data from APIs</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400">
        <p className="mb-2">{error}</p>
        <button 
          onClick={fetchMiningData}
          className="px-4 py-2 bg-[hsl(158,100%,50%)] text-black rounded-lg text-sm hover:bg-[hsl(158,100%,45%)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        {/* BOB Price */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">BOB Price</span>
            <DollarSign className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {formatPrice(data.bobPrice)}
          </span>
        </div>

        {/* BOB Market Cap */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Market Cap</span>
            <TrendingUp className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {formatCurrency(data.bobMarketCap)}
          </span>
        </div>

        {/* BOB Cycles Burn Rate */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Burn Rate</span>
            <Activity className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {formatDailyBurn(data.bobCyclesBurnRateUSD)}
          </span>
        </div>

        {/* BOB Index */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Block Rewards</span>
            <Coins className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-mono font-bold text-white">
                {data.blockRewards} BOB
            </span>
          </div>
        </div>
      </div>

      {/* Mining Progress */}
      <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10 mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Mining Progress</span>
          <span className="text-xs font-mono text-[hsl(158,100%,50%)]">
            {data.bobMinedPercentage.toFixed(2)}%
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 mb-3">
          <div 
            className="bg-gradient-to-r from-[hsl(158,100%,50%)] to-[hsl(158,100%,40%)] h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(data.bobMinedPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <div className="text-gray-500">
            <span className="text-white">{formatNumber(data.totalSupply)}</span> mined
          </div>
          <div className="text-gray-500">
            <span className="text-white">21M</span> max supply
          </div>
        </div>
      </div>
    </div>
  );
};
