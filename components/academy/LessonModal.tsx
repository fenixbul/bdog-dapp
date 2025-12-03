'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Lesson } from './academy';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson;
  lessons: Lesson[];
  onNextLesson: () => void;
  onMarkViewed: (lessonId: string) => void;
  onPreviousLesson?: () => void;
  progress: number;
  canAccessQuiz?: boolean;
  onStartQuiz?: () => void;
}

export function LessonModal({ 
  isOpen, 
  onClose, 
  lesson, 
  lessons, 
  onNextLesson, 
  onMarkViewed,
  onPreviousLesson,
  progress,
  canAccessQuiz = false,
  onStartQuiz
}: LessonModalProps) {
  const currentIndex = lessons.findIndex(l => l.id === lesson.id);
  const isLastLesson = currentIndex === lessons.length - 1;
  const isFirstLesson = currentIndex === 0;

  // Mark lesson as viewed when modal opens
  useEffect(() => {
    if (isOpen) {
      onMarkViewed(lesson.id);
    }
  }, [isOpen, lesson.id, onMarkViewed]);
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
              <p className="text-lg text-muted-foreground mb-4 font-medium">
                {lesson.subtitle}
              </p>

              {/* Progress Section */}
              <div className="mb-6">
                {/* Progress Percentage */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                    Progress
                  </span>
                  <span className="text-3xl font-bold text-white">
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>

              {/* Content Body */}
              <div className="text-foreground leading-relaxed mb-6">
                {lesson.content}
              </div>

              {/* Navigation Buttons */}
              <div className="pt-4 border-t border-border">
                <div className="flex gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={onPreviousLesson}
                    disabled={isFirstLesson}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-opacity ${
                      isFirstLesson
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'bg-secondary text-secondary-foreground hover:opacity-90'
                    }`}
                    aria-label="Previous lesson"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span>Previous</span>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={isLastLesson && canAccessQuiz && onStartQuiz ? onStartQuiz : onNextLesson}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                    aria-label={isLastLesson && canAccessQuiz ? "Start Quiz" : "Next lesson"}
                  >
                    <span>
                      {isLastLesson 
                        ? (canAccessQuiz ? 'Start Quiz' : 'Back to Start')
                        : 'Next'
                      }
                    </span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

