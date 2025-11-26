'use client';

import { useEffect, useState } from 'react';
import { getBoblaunchActor } from '@/lib/actors';
import { priceService } from '@/lib/price-service';
import { formatHumanReadable } from '@/lib/utils';
import type { TokenData } from '@/lib/canisters/boblaunch.did.d.ts';

interface TokenStatsProps {
  className?: string;
}

const TokenStats = ({ className = '' }: TokenStatsProps) => {
  const [marketCap, setMarketCap] = useState(0);
  const [holderCount, setHolderCount] = useState(0);
  const [icpPriceUSD, setIcpPriceUSD] = useState(0);
  const [bdogPriceInUSD, setBdogPriceInUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  const tokenId = 2908n; // BDOG token ID in boblaunch canister

  const fetchTokenData = async () => {
    try {
      const actor = getBoblaunchActor();
      const tokenData = await actor.get_token_data(tokenId);
      
      setTokenData(tokenData);
      setHolderCount(tokenData.top_holders.length);
      
      // Get token price from last candle close
      const latestCandle = priceService.findLatestCandle(tokenData.candles);
      const tokenPriceUSD = latestCandle ? latestCandle.close : 0;
      setBdogPriceInUSD(tokenPriceUSD);
        
      // Calculate market cap using new formula
      const currentIcpPrice = priceService.getIcpPriceUSD();
      if (currentIcpPrice > 0 && latestCandle) {
        const reserveIcp = tokenData.liquidity_pool.reserve_icp;
        const marketCapUSD = priceService.calculateMarketCapUSD(reserveIcp, currentIcpPrice, latestCandle.close);
          setMarketCap(marketCapUSD);
      }
    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Subscribe to ICP price updates
    const unsubscribe = priceService.subscribe((price) => {
      setIcpPriceUSD(price);
    });

    // Start price service and wait for it to fetch price
    const initializeData = async () => {
      // Start price service
      priceService.startAutoUpdate();
      
      // Wait a bit for price to be fetched, then get token data
      setTimeout(() => {
        fetchTokenData();
      }, 1000); // Give price service time to fetch ICP price
    };

    initializeData();

    // Cleanup
    return () => {
      unsubscribe();
      priceService.stopAutoUpdate();
    };
  }, []);

  // Separate effect to recalculate market cap when ICP price or token data changes
  useEffect(() => {
    if (tokenData && icpPriceUSD > 0) {
      // Get token price from last candle close
      const latestCandle = priceService.findLatestCandle(tokenData.candles);
      if (latestCandle) {
        const tokenPriceUSD = latestCandle.close;
        setBdogPriceInUSD(tokenPriceUSD);
        
        // Calculate market cap using new formula
        const reserveIcp = tokenData.liquidity_pool.reserve_icp;
        const marketCapUSD = priceService.calculateMarketCapUSD(reserveIcp, icpPriceUSD, latestCandle.close);
      setMarketCap(marketCapUSD);
      
      console.log('Prices calculated:', {
          tokenPriceUSD,
          icpPriceUSD,
          reserveIcp: reserveIcp.toString(),
          lastCandleClose: latestCandle.close,
        marketCapUSD
      });
    }
    }
  }, [tokenData, icpPriceUSD]);

  const formatMarketCap = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatHolders = (count: number) => {
    return formatHumanReadable(count, {
      decimals: 1,
      useSpacing: true,
      maxValue: 1000
    });
  };

  const cutTokenPrice = (price: number) => {
    const priceStr = price.toString();

    if (price >= 0.01) {
      // Cut to 2 decimal places
      return (Math.floor(price * 100) / 100).toFixed(2);
    } else {
      // Count leading zeros after decimal
      const match = priceStr.match(/^0\.(0+)(\d+)/);
      if (match) {
        const zeros = match[1].length;
        const digits = match[2].slice(0, 2); // keep 2 sig digits
        if (zeros > 3) {
          return `0(${zeros})${digits}`;
        } else {
          return `0.${'0'.repeat(zeros)}${digits}`;
        }
      }
      return priceStr; // fallback
    }
  };


  const formatBdogPriceUSD = (price: number) => {
    if (price === 0) return '$0';
    return `$${cutTokenPrice(price)}`;
  };

  if (loading) {
    return (
      <div className={`stats-card ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Row 1: Market Cap & Holders */}
            <div className="lg:mb-6">
              <div className="stats-label">Market Cap</div>
              <div className="h-5 lg:h-6 bg-gray-200 rounded w-20 lg:w-24"></div>
            </div>
            <div className="lg:mb-6">
              <div className="stats-label">Holders</div>
              <div className="h-5 lg:h-6 bg-gray-200 rounded w-14 lg:w-16"></div>
            </div>
            
            {/* Row 2: USD Price */}
            <div>
              <div className="stats-label">Price (USD)</div>
              <div className="h-5 lg:h-6 bg-gray-200 rounded w-16 lg:w-20"></div>
            </div>
            <div>
              {/* Empty div to maintain grid layout */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stats-card ${className}`}>
      {/* Stats Grid - 2 columns on mobile, 2 columns on desktop */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Row 1: Market Cap & Holders */}
        {/* Market Cap */}
        <div className="lg:mb-6">
          <div className="stats-label">Market Cap</div>
          <div 
            className="stats-value text-lg lg:text-xl"
            aria-label={`Market capitalization ${marketCap} US dollars`}
          >
            {formatMarketCap(marketCap)}
          </div>
        </div>

        {/* Holders Count */}
        <div className="lg:mb-6">
          <div className="stats-label">Holders</div>
          <div className="stats-value text-lg lg:text-xl">
            {formatHolders(holderCount)}
          </div>
        </div>

        {/* Row 2: USD Price */}
        {/* BDOG Price in USD */}
        <div>
          <div className="stats-label">Price (USD)</div>
          <div 
            className="stats-value text-lg lg:text-xl"
            aria-label={`BDOG price ${bdogPriceInUSD} US dollars`}
          >
            {formatBdogPriceUSD(bdogPriceInUSD)}
          </div>
        </div>

        {/* Empty div to maintain grid layout */}
        <div></div>
      </div>

      {/* Live Badge */}
      <div className="live-badge">
        <div className="live-dot" aria-hidden="true" />
        <span>Live data from launch.bob.fun</span>
      </div>
    </div>
  );
};

export default TokenStats;
