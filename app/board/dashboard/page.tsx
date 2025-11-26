'use client';

import React, { useState } from 'react';
import { Navigator, Overview, Board, Signals } from '@/components/board';
import { Button } from '@/components/ui';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type TabType = 'overview' | 'board' | 'signals';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'board':
        return <Board />;
      case 'signals':
        return <Signals />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navigation */}
      <Navigator activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <main className="pb-20">
        {renderActiveComponent()}
      </main>
      
      {/* Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/board">
            <Button 
              variant="secondary" 
              className="px-6 py-3 border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Intro
            </Button>
          </Link>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400 hidden sm:block">
              Ready for the full experience?
            </span>
            <Button 
              variant="primary" 
              className="px-8 py-3 font-bold"
            >
              Open BDOG Dashboard
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

