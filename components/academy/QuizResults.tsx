'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, AlertCircle, CheckCircle2, ArrowLeft, BookOpen } from 'lucide-react';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onTryAgain: () => void;
  onReviewLessons: () => void;
  onBackToAcademy: () => void;
}

export function QuizResults({
  score,
  totalQuestions,
  onTryAgain,
  onReviewLessons,
  onBackToAcademy,
}: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = score >= Math.ceil(totalQuestions * 0.8); // 80% threshold (6/7 for 7 questions)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl shadow-xl"
      >
        <div className="p-6 max-h-[85vh] overflow-y-auto max-w-md mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            {passed ? (
              <>
                {/* Win Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4"
                >
                  <Trophy className="h-10 w-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Congratulations!
                </h2>
                <p className="text-muted-foreground text-center">
                  You passed the quiz!
                </p>
              </>
            ) : (
              <>
                {/* Lose State */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-4"
                >
                  <AlertCircle className="h-10 w-10 text-orange-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Keep Learning!
                </h2>
                <p className="text-muted-foreground text-center">
                  Review the lessons and try again
                </p>
              </>
            )}
          </div>

          {/* Score Display */}
          <div className="mb-6 p-4 bg-muted text-center">
            <div className="text-3xl font-bold text-foreground mb-1">
              {score} / {totalQuestions}
            </div>
            {!passed && (
              <div className="mt-2 text-sm text-muted-foreground">
                Need {Math.ceil(totalQuestions * 0.8)} correct to pass
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {!passed && (
              <>
                <button
                  onClick={onReviewLessons}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Review Lessons</span>
                </button>
              </>
            )}
            <button
              onClick={onBackToAcademy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Academy</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

