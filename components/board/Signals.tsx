'use client';

import React from 'react';
import { TrendingUp, MessageSquare, Plus, ThumbsUp, Clock, Users } from 'lucide-react';

export default function Signals() {
  const signals = [
    {
      id: 1,
      title: 'Increase marketing visibility',
      description: 'Focus on social media presence and community outreach',
      priority: 'high',
      votes: 24,
      author: 'Top Holder',
      timeAgo: '2 hours ago',
      status: 'active'
    },
    {
      id: 2,
      title: 'Weekly transparency reports',
      description: 'Regular updates on development progress and milestones',
      priority: 'high',
      votes: 18,
      author: 'Community',
      timeAgo: '5 hours ago',
      status: 'active'
    },
    {
      id: 3,
      title: 'Partnership with DeFi protocols',
      description: 'Explore integration opportunities with major DeFi platforms',
      priority: 'medium',
      votes: 12,
      author: 'Investor',
      timeAgo: '1 day ago',
      status: 'under_review'
    },
    {
      id: 4,
      title: 'Mobile app development',
      description: 'Native mobile application for better user experience',
      priority: 'medium',
      votes: 9,
      author: 'Holder',
      timeAgo: '2 days ago',
      status: 'planned'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[#00ff9e] bg-[#00ff9e]/10';
      case 'under_review': return 'text-yellow-400 bg-yellow-400/10';
      case 'planned': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'under_review': return 'Under Review';
      case 'planned': return 'Planned';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Community Signals</h1>
            <p className="text-gray-400">Top priorities from investors and holders</p>
          </div>
          <button className="px-6 py-3 bg-[#00ff9e] text-black rounded-lg font-bold hover:bg-[#00e68a] transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Your Signal</span>
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <MessageSquare className="w-4 h-4 text-[#00ff9e]" />
              <span className="text-sm text-gray-400">Total Signals</span>
            </div>
            <span className="text-2xl font-bold text-white">47</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#00ff9e]" />
              <span className="text-sm text-gray-400">Active</span>
            </div>
            <span className="text-2xl font-bold text-white">12</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <ThumbsUp className="w-4 h-4 text-[#00ff9e]" />
              <span className="text-sm text-gray-400">Total Votes</span>
            </div>
            <span className="text-2xl font-bold text-white">156</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-[#00ff9e]" />
              <span className="text-sm text-gray-400">Participants</span>
            </div>
            <span className="text-2xl font-bold text-white">89</span>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {signals.map((signal, index) => (
          <div key={signal.id} className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                {/* Priority Rank */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[#00ff9e] rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-white text-lg">{signal.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(signal.priority)}`}>
                      {signal.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(signal.status)}`}>
                      {getStatusText(signal.status)}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4 leading-relaxed">{signal.description}</p>
                  
                  {/* Meta Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{signal.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{signal.timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Vote Section */}
              <div className="flex-shrink-0 text-center">
                <button className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group">
                  <ThumbsUp className="w-5 h-5 text-gray-400 group-hover:text-[#00ff9e] transition-colors" />
                  <span className="text-sm font-bold text-white">{signal.votes}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Signal CTA */}
      <div className="mt-12 text-center">
        <div className="bg-gray-900 rounded-lg border-2 border-dashed border-gray-700 p-8">
          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Have a priority for BDOG?</h3>
          <p className="text-gray-400 mb-6">Share your signal and help guide the direction of the project</p>
          <button className="px-8 py-4 bg-[#00ff9e] text-black rounded-lg font-bold hover:bg-[#00e68a] transition-colors flex items-center space-x-2 mx-auto">
            <Plus className="w-5 h-5" />
            <span>Add Your Signal</span>
          </button>
        </div>
      </div>
    </div>
  );
}

