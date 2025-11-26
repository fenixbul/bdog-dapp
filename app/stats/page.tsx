'use client';

import React from 'react';
import { StatsCard } from '@/components/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-[#F7931A]">
            BDOG Stats Dashboard
          </h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Real-Time Statistics
          </h2>
          <p className="text-gray-400">
            Live data for BDOG token and BOB mining operations
          </p>
        </div>

        {/* Stats Card Container */}
        <div className="w-full max-w-lg mx-auto">
          <div className="h-[600px] md:h-[460px]">
            <StatsCard />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900/10 rounded-lg p-6 border border-white/10">
            <h3 className="text-xl font-bold text-[#F7931A] mb-4">
              About BDOG Stats
            </h3>
            <p className="text-gray-300 mb-4">
              Real-time statistics for BDOG token performance, including price tracking, 
              market cap, holder count, and launch progress metrics.
            </p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Live price updates every 45 seconds</li>
              <li>• Market cap and volume tracking</li>
              <li>• Holder distribution analytics</li>
              <li>• Launch progress monitoring</li>
            </ul>
          </div>

          <div className="bg-gray-900/10 rounded-lg p-6 border border-white/10">
            <h3 className="text-xl font-bold text-[#F7931A] mb-4">
              BOB Mining Data
            </h3>
            <p className="text-gray-300 mb-4">
              Comprehensive mining statistics for the BOB network, including burn rates, 
              miner counts, and supply information.
            </p>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Daily cycle burn tracking</li>
              <li>• Total miners and block data</li>
              <li>• Halving countdown</li>
              <li>• Network performance metrics</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 p-8">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          <p>
            BDOG Stats Dashboard - Real-time blockchain data visualization
          </p>
          <p className="mt-2">
            Data refreshes automatically every 45 seconds
          </p>
        </div>
      </footer>
    </div>
  );
}

