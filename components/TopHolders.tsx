'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { holdersService, type HolderData } from '@/lib/holders-service';

interface TopHoldersProps {
  limit?: number;
  className?: string;
}

const TopHolders = ({ 
  limit = 10,
  className = '' 
}: TopHoldersProps) => {
  const [holders, setHolders] = useState<HolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSupply, setTotalSupply] = useState<bigint>(0n);

  // Get label for special principals
  const getPrincipalLabel = (principal: string) => {
    if (principal === "qdzln-ab4cf-cwgaa-nyzus-x3gag-o7kxy-ktiew-jtwrb-pmit5-m6txi-cqe") {
      return "DEV";
    }
    return null;
  };

  const fetchHolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await holdersService.getTopHolders(limit + 5); // Get extra to account for filtering
      
      if (response.error) {
        setError(response.error);
        setHolders([]);
      } else {
        // Filter out pool principal and take requested limit
        const filteredHolders = response.holders
          .filter(holder => holder.principal !== "h7uwa-hyaaa-aaaam-qbgvq-cai") // Skip pool
          .slice(0, limit);
        setHolders(filteredHolders);
        setTotalSupply(response.totalSupply);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holders');
      setHolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolders();
  }, [limit]);

  const handleRefresh = () => {
    holdersService.clearCache();
    fetchHolders();
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Holders</h3>
          <div className="animate-pulse">
            <div className="h-4 w-16 bg-gray-200"></div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between p-3 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-6 bg-gray-200"></div>
                  <div className="h-4 w-32 bg-gray-200"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="h-4 w-16 bg-gray-200"></div>
                  <div className="h-4 w-12 bg-gray-200"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Holders</h3>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Retry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">⚠️</div>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Holders</h3>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-600 text-sm">No holders found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Holders</h3>
        <button
          onClick={handleRefresh}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title="Refresh holders data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Header Row */}
      <div className="hidden sm:grid gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-3" style={{ gridTemplateColumns: '32px 1fr auto auto' }}>
        <span>Rank</span>
        <span>Address</span>
        <span>Balance</span>
        <span>Share</span>
      </div>

      {/* Holders List */}
      <div className="space-y-2">
        {holders.map((holder, index) => (
          <div 
            key={holder.principal}
            className="flex flex-col sm:grid gap-2 sm:gap-4 p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            style={{ gridTemplateColumns: '32px 1fr auto auto' }}
          >
            {/* Rank & Address (Mobile: single row, Desktop: separate columns) */}
            <div className="flex items-center space-x-3 sm:space-x-0 sm:contents">
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-6 text-sm font-medium text-gray-600 bg-white border">
                {index + 1}
              </div>
              
              {/* Address */}
              <div className="sm:flex sm:items-center min-w-0 flex-1 sm:flex-none">
                <div className="flex items-center space-x-2">
                  <code className="text-sm font-mono text-gray-800 truncate">
                    {holdersService.formatPrincipal(holder.principal, 8)}
                  </code>
                  {getPrincipalLabel(holder.principal) && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#00e68a] text-black rounded">
                      {getPrincipalLabel(holder.principal)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Balance & Share (Mobile: single row, Desktop: separate columns) */}
            <div className="flex justify-between sm:contents">
              {/* Token Balance */}
              <div className="sm:flex sm:items-center">
                <div className="text-sm text-gray-900 font-medium">
                  {holdersService.formatTokenBalance(holder.tokenBalance)}
                  <span className="text-xs text-gray-500 ml-1">BDOG</span>
                </div>
              </div>

              {/* Percentage */}
              <div className="sm:flex sm:items-center">
                <div className="text-sm font-semibold text-gray-900">
                  {holdersService.formatPercentage(holder.percentage)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Showing top {holders.length} holders</span>
          <span>
            {/* Total Supply: {holdersService.formatTotalSupply(totalSupply)} BDOG */}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopHolders;
