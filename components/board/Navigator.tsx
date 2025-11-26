'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

interface NavigatorProps {
  activeTab: 'overview' | 'board' | 'signals';
  onTabChange: (tab: 'overview' | 'board' | 'signals') => void;
}

export default function Navigator({ activeTab, onTabChange }: NavigatorProps) {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'board', label: 'Board' },
    { id: 'signals', label: 'Signals' },
  ] as const;

  return (
    <div className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* BDOG Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#00ff9e] to-[#00cc7a] rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold text-[#00ff9e]">BDOG Board</h1>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-900 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#00ff9e] text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

