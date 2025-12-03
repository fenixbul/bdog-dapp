'use client';

import { Lightbulb, ChevronRight, Check } from 'lucide-react';
import type { Lesson } from './academy';

interface LessonCardProps {
  lesson: Lesson;
  onClick: () => void;
  isViewed?: boolean;
}

export function LessonCard({ lesson, onClick, isViewed = false }: LessonCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white text-black dark:bg-zinc-900 dark:text-white p-4 rounded-2xl shadow-sm border flex items-center gap-4 group relative overflow-hidden hover:shadow-md transition-transform duration-200 ease-out hover:scale-[1.01] active:scale-[0.99] ${
        isViewed 
          ? 'border-white/60 dark:border-zinc-700 opacity-95' 
          : 'border-white dark:border-zinc-800'
      }`}
    >
      {/* Icon Wrapper */}
      <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center transition-colors bg-black text-white dark:bg-blue-500/10 dark:text-blue-400">
        {lesson.icon || <Lightbulb className="h-6 w-6" />}
      </div>

      {/* Content Area */}
      <div className="flex-1 text-left">
        <h3 className="font-bold text-base text-black dark:text-white mb-1">
          {lesson.title}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-400 line-clamp-1">
          {lesson.subtitle}
        </p>
      </div>

      {/* Checkmark or Chevron */}
      {isViewed ? (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-dark flex items-center justify-center">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </div>
      ) : (
        <ChevronRight className="h-5 w-5 text-black dark:text-zinc-600 transition-colors flex-shrink-0" />
      )}
    </button>
  );
}

