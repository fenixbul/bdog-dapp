'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, AlertCircle, CheckCircle2, Coins, ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onTryAgain: () => void;
  onReviewLessons: () => void;
  onBackToAcademy: () => void;
  onClaimReward?: () => Promise<void> | void;
  isRewardClaimed?: boolean;
}

export function QuizResults({
  score,
  totalQuestions,
  onTryAgain,
  onReviewLessons,
  onBackToAcademy,
  onClaimReward,
  isRewardClaimed = false,
}: QuizResultsProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = score >= Math.ceil(totalQuestions * 0.8); // 80% threshold (6/7 for 7 questions)
  const rewardAmount = 50; // BDOG tokens

  const handleClaimReward = async () => {
    if (!onClaimReward || isRewardClaimed || isClaiming) return;

    setIsClaiming(true);
    setClaimError(null);

    try {
      await onClaimReward();
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : 'Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

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
          <div className="mb-6 p-4 bg-muted rounded-lg text-center">
            <div className="text-3xl font-bold text-foreground mb-1">
              {score} / {totalQuestions}
            </div>
            {!passed && (
              <div className="mt-2 text-sm text-muted-foreground">
                Need {Math.ceil(totalQuestions * 0.8)} correct to pass
              </div>
            )}
          </div>

          {/* Reward Display (Win only) */}
          {passed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold text-foreground">
                  {isRewardClaimed ? (
                    <>You earned {rewardAmount} BDOG tokens! (Claimed)</>
                  ) : (
                    <>You earned {rewardAmount} BDOG tokens!</>
                  )}
                </span>
              </div>
              {onClaimReward && !isRewardClaimed && (
                <div className="mt-3">
                  <button
                    onClick={handleClaimReward}
                    disabled={isClaiming}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 ${
                      isClaiming
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Claiming...</span>
                      </>
                    ) : (
                      <span>Claim Reward</span>
                    )}
                  </button>
                  {claimError && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      {claimError}
                    </p>
                  )}
                </div>
              )}
              {isRewardClaimed && (
                <div className="mt-3 px-4 py-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  Reward already claimed
                </div>
              )}
            </motion.div>
          )}

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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
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

