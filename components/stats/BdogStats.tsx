"use client";
import React, { useState, useEffect } from 'react';
import { icexplorerService, type IcexplorerTokenData } from '@/lib/icexplorer-service';
import { TrendingUp, TrendingDown, Users, BarChart3, Activity, Coins, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const BDOG_LEDGER_ID = "2qqix-tiaaa-aaaam-qeria-cai";

export const BdogStats: React.FC = () => {
  const [data, setData] = useState<IcexplorerTokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBdogData();
    
    // Start auto-refresh service
    icexplorerService.startAutoRefresh(BDOG_LEDGER_ID);
    
    // Subscribe to updates
    const unsubscribe = icexplorerService.subscribe(BDOG_LEDGER_ID, (newData: IcexplorerTokenData) => {
      setData(newData);
      setError(null);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      icexplorerService.stopAutoRefresh(BDOG_LEDGER_ID);
    };
  }, []);

  const fetchBdogData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const tokenData = await icexplorerService.getData(BDOG_LEDGER_ID);
      setData(tokenData);
    } catch (err) {
      console.error('Failed to fetch BDOG data:', err);
      setError('Failed to load BDOG data');
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

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatTotalSupply = (supply: number): string => {
    // Truncate to millions and display with "M" suffix
    const millions = (supply / 100000000000000).toFixed(2);
    return `${millions}M`;
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(BDOG_LEDGER_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(158,100%,50%)] mb-4"></div>
        <p className="text-gray-400 text-sm">Loading BDOG data...</p>
        <p className="text-gray-500 text-xs mt-2">Fetching real-time data from APIs</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400">
        <p className="mb-2">{error}</p>
        <button 
          onClick={fetchBdogData}
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
        {/* Total Supply */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Total Supply</span>
            <Coins className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {formatTotalSupply(data.totalSupply)}
          </span>
        </div>

        {/* Market Cap */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Market Cap</span>
            <BarChart3 className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-mono font-bold text-white">
              {formatCurrency(data.marketCap)}
            </span>
          </div>
        </div>

        {/* Total Holders */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Holders</span>
            <Users className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {data.holderAmount.toLocaleString()}
          </span>
        </div>

        {/* Transactions */}
        <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Transactions</span>
            <Activity className="w-4 h-4 text-[hsl(158,100%,50%)]" />
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {data.transactionAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Contract Address */}
      <div className="bg-gray-900/10 rounded-lg p-4 border border-white/10 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[hsl(158,100%,50%)]" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Ledger CA</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-white flex-1 break-all">
            {BDOG_LEDGER_ID}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyAddress}
                className="h-8 w-8 text-[hsl(158,100%,50%)] hover:text-[hsl(158,100%,45%)] hover:bg-white/10"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
