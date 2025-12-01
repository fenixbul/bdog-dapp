'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Lightbulb, ChevronRight } from 'lucide-react';
import type { Lesson } from './academy';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  lessons: Lesson[];
  onNextLesson: () => void;
}

export function LessonModal({ isOpen, onClose, lesson, lessons, onNextLesson }: LessonModalProps) {
  const currentIndex = lessons.findIndex(l => l.id === lesson.id);
  const isLastLesson = currentIndex === lessons.length - 1;
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Container (Bottom Sheet) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-xl"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto max-w-md mx-auto">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-6">
                {/* Title Group */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-black dark:bg-blue-500/10 dark:text-blue-400">
                    {lesson.icon || <Lightbulb className="h-5 w-5" />}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {lesson.title}
                  </h2>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-6 font-medium">
                {lesson.subtitle}
              </p>

              {/* Content Body */}
              <div className="text-foreground leading-relaxed mb-6">
                {lesson.content}
              </div>

              {/* Next Button */}
              <div className="pt-4 border-t border-border">
                <button
                  onClick={onNextLesson}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                  aria-label="Next lesson"
                >
                  <span>{isLastLesson ? 'Back to Start' : 'Next'}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

