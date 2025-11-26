'use client';

import React from 'react';
import { Clock, CheckCircle, ArrowRight, User, Calendar } from 'lucide-react';

export default function Board() {
  const columns = [
    {
      title: 'Now',
      color: 'border-[#00ff9e]',
      tasks: [
        {
          id: 1,
          title: 'Launch holder sync calls',
          description: 'Set up weekly community alignment meetings',
          assignee: 'Team',
          priority: 'high',
          dueDate: 'This Friday'
        },
        {
          id: 2,
          title: 'Implement feedback system',
          description: 'Build signal collection interface',
          assignee: 'Dev',
          priority: 'high',
          dueDate: 'Next week'
        }
      ]
    },
    {
      title: 'Next',
      color: 'border-yellow-500',
      tasks: [
        {
          id: 3,
          title: 'Community dashboard v2',
          description: 'Enhanced analytics and reporting',
          assignee: 'Design',
          priority: 'medium',
          dueDate: 'End of month'
        },
        {
          id: 4,
          title: 'Holder education series',
          description: 'Weekly educational content creation',
          assignee: 'Content',
          priority: 'medium',
          dueDate: 'Ongoing'
        },
        {
          id: 5,
          title: 'Partnership outreach',
          description: 'Strategic collaboration initiatives',
          assignee: 'BD',
          priority: 'low',
          dueDate: 'Q1 2024'
        }
      ]
    },
    {
      title: 'Done',
      color: 'border-gray-600',
      tasks: [
        {
          id: 6,
          title: 'Board dashboard launch',
          description: 'Initial version of transparency dashboard',
          assignee: 'Dev',
          priority: 'high',
          dueDate: 'Completed'
        },
        {
          id: 7,
          title: 'Telegram community setup',
          description: 'Organized community communication channels',
          assignee: 'Community',
          priority: 'high',
          dueDate: 'Completed'
        }
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Task Board</h1>
        <p className="text-gray-400">Track progress across all BDOG initiatives</p>
      </div>
      
      {/* Mobile: Horizontal scroll, Desktop: Grid */}
      <div className="flex gap-6 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible">
        {columns.map((column) => (
          <div key={column.title} className="flex-shrink-0 w-80 md:w-auto">
            <div className={`bg-gray-900 rounded-lg border-2 ${column.color} h-full`}>
              {/* Column Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">{column.title}</h2>
                  <span className="text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {column.tasks.length}
                  </span>
                </div>
              </div>
              
              {/* Tasks */}
              <div className="p-4 space-y-3">
                {column.tasks.map((task) => (
                  <div key={task.id} className="bg-black rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white text-sm leading-tight">{task.title}</h3>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 mt-1 ${
                        task.priority === 'high' ? 'bg-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">{task.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-500">{task.assignee}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {column.title === 'Done' ? (
                          <CheckCircle className="w-3 h-3 text-[#00ff9e]" />
                        ) : (
                          <Calendar className="w-3 h-3 text-gray-500" />
                        )}
                        <span className={column.title === 'Done' ? 'text-[#00ff9e]' : 'text-gray-500'}>
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Task Button */}
                {column.title !== 'Done' && (
                  <button className="w-full p-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors text-sm">
                    + Add task
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile scroll indicator */}
      <div className="md:hidden mt-4 flex justify-center">
        <div className="flex items-center space-x-1 text-gray-500 text-xs">
          <ArrowRight className="w-3 h-3" />
          <span>Scroll to see all columns</span>
        </div>
      </div>
    </div>
  );
}

