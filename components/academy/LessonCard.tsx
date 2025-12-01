'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';
import type { Lesson } from './academy';

interface LessonCardProps {
  lesson: Lesson;
  onClick: () => void;
}

export function LessonCard({ lesson, onClick }: LessonCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full bg-[#00ff9e] text-black dark:bg-zinc-900 dark:text-white p-4 rounded-2xl shadow-sm border border-primary dark:border-zinc-800 flex items-center gap-4 group hover:shadow-md transition-all relative overflow-hidden"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
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

      {/* Chevron */}
      <ChevronRight className="h-5 w-5 text-black dark:text-zinc-600  transition-colors flex-shrink-0" />
    </motion.button>
  );
}

