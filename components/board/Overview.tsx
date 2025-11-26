'use client';

import React from 'react';
import { Target, Activity, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function Overview() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* This Week's Focus */}
        <div className="lg:col-span-2 bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-[#00ff9e] rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">This Week's Focus</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-black rounded-lg p-4 border border-[#00ff9e]">
              <h3 className="font-semibold text-[#00ff9e] mb-2">Community Alignment Initiative</h3>
              <p className="text-gray-300 text-sm">
                Launch weekly holder sync calls and implement feedback collection system
              </p>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Due Friday</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4 text-[#00ff9e]" />
                  <span className="text-xs text-[#00ff9e]">In Progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Snapshot */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-[#00ff9e] rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <h2 className="text-lg font-bold text-white">Health</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Community Sync</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#00ff9e] rounded-full"></div>
                <span className="text-sm text-[#00ff9e]">Strong</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Task Velocity</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-500">Moderate</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Holder Engagement</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#00ff9e] rounded-full"></div>
                <span className="text-sm text-[#00ff9e]">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alignment Status */}
        <div className="md:col-span-2 lg:col-span-3 bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-[#00ff9e] rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-black" />
            </div>
            <h2 className="text-xl font-bold text-white">Team & Community Alignment</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-black rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Core Team</h3>
                <CheckCircle className="w-5 h-5 text-[#00ff9e]" />
              </div>
              <p className="text-sm text-gray-400">All members aligned on weekly priorities</p>
            </div>
            <div className="bg-black rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Top Holders</h3>
                <CheckCircle className="w-5 h-5 text-[#00ff9e]" />
              </div>
              <p className="text-sm text-gray-400">Active participation in governance decisions</p>
            </div>
            <div className="bg-black rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">Community</h3>
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3 text-black" />
                </div>
              </div>
              <p className="text-sm text-gray-400">Feedback collection system launching this week</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-2 lg:col-span-3 bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-[#00ff9e] text-black rounded-lg font-medium text-sm hover:bg-[#00e68a] transition-colors">
              Update Weekly Focus
            </button>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors border border-gray-700">
              View All Tasks
            </button>
            <button className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors border border-gray-700">
              Check Signals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

