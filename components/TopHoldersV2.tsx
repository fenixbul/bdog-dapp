'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { icexplorerService, type IcexplorerHolderData } from '@/lib/icexplorer-service';
import { formatTokenBalance, formatPercentage } from '@/lib/utils';

interface TopHoldersV2Props {
  ledgerId?: string;
  pageSize?: number;
  className?: string;
}

const ICS_POOL_PRINCIPAL = "uzhtn-yiaaa-aaaar-qbyza-cai";
const DEFAULT_LEDGER_ID = "2qqix-tiaaa-aaaam-qeria-cai";

const TopHoldersV2 = ({ 
  ledgerId = DEFAULT_LEDGER_ID,
  pageSize = 10,
  className = '' 
}: TopHoldersV2Props) => {
  const [holders, setHolders] = useState<IcexplorerHolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSupply, setTotalSupply] = useState<number>(0);

  // Get label for special principals
  const getPrincipalLabel = (owner: string) => {
    if (owner === ICS_POOL_PRINCIPAL) {
      return "ICS POOL";
    }
    return null;
  };

  // Format principal for display (truncate with ellipsis)
  const formatPrincipal = (principal: string, length: number = 8): string => {
    if (principal.length <= length * 2) {
      return principal;
    }
    return `${principal.slice(0, length)}...${principal.slice(-length)}`;
  };

  // Format token balance
  const formatBalance = (amount: number, tokenDecimal: number = 8): string => {
    // Amount from API is already in token units (with decimals), convert to smallest unit (bigint)
    // Multiply by 10^decimals and convert to bigint
    const amountInSmallestUnit = BigInt(Math.floor(amount * (10 ** tokenDecimal)));
    return formatTokenBalance(amountInSmallestUnit, tokenDecimal, {
      showDecimals: true,
      useKM: true,
      maxValue: 100000
    });
  };

  // Calculate percentage of total supply
  const calculatePercentage = (amount: number, total: number): number => {
    if (total === 0) return 0;
    return (amount / total) * 100;
  };

  const fetchHolders = async (page: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await icexplorerService.getHolders(ledgerId, page, pageSize, true);
      
      // Keep all holders including ICS Pool
      if (append) {
        setHolders(prev => [...prev, ...response.holders]);
      } else {
        setHolders(response.holders);
        if (response.holders.length > 0) {
          setTotalSupply(response.holders[0].totalSupply);
        }
      }

      setCurrentPage(page);
      setTotalPages(response.pages);
      // Calculate hasNextPage: check if current page is less than total pages
      // This is more reliable than the API's hasNextPage field which may be incorrect
      const calculatedHasNext = response.pages > 0 && page < response.pages;
      setHasNextPage(calculatedHasNext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holders');
      if (!append) {
        setHolders([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHolders(1, false);
  }, [ledgerId, pageSize]);

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchHolders(1, false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchHolders(currentPage + 1, true);
    }
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

  if (error && holders.length === 0) {
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
        {holders.map((holder, index) => {
          const percentage = calculatePercentage(holder.amount, totalSupply);
          return (
            <div 
              key={`${holder.owner}-${holder.accountId}-${index}`}
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
                      {formatPrincipal(holder.owner, 8)}
                    </code>
                    {getPrincipalLabel(holder.owner) && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#00e68a] text-black rounded">
                        {getPrincipalLabel(holder.owner)}
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
                    {formatBalance(holder.amount, holder.tokenDecimal)}
                    <span className="text-xs text-gray-500 ml-1">BDOG</span>
                  </div>
                </div>

                {/* Percentage */}
                <div className="sm:flex sm:items-center">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPercentage(percentage)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button - Show if there are more pages available */}
      {hasNextPage && currentPage < totalPages && (
        <div className="mt-0 pt-4 border-gray-200">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          Powered by{' '}
          <a
            href="https://www.icexplorer.io/token/details/2qqix-tiaaa-aaaam-qeria-cai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline hover:text-gray-700 transition-colors"
          >
            IC Explorer
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopHoldersV2;

