"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

interface AcademyHeroProps {
  progress: number;
  onStartJourney: () => void;
  canAccessQuiz?: boolean;
  onStartQuiz?: () => void;
}

export function AcademyHero({
  progress,
  onStartJourney,
  canAccessQuiz = false,
  onStartQuiz,
}: AcademyHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-6 mt-6 mb-4"
    >
      <div className="w-full bg-[#00ff9e] text-black dark:bg-zinc-900 dark:text-white p-4 shadow-sm border border-primary dark:border-zinc-800">
        {/* Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-black text-white dark:bg-blue-500/10 dark:text-blue-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h2 className="font-bold lg:text-xl text-lg text-black dark:text-white">
            Learn About BOB
          </h2>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 dark:text-gray-400 mb-6">
          <>
            Master the basics, test your knowledge...<br></br>
            <b>Get BDOG tokens!!!</b>
          </>
        </p>

        {/* Progress Section */}
        <div className="mb-6">
          {/* Progress Percentage */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
              Progress
            </span>
            <span className="text-3xl font-bold text-black dark:text-white">
              {progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full bg-black dark:bg-white rounded-full"
            />
          </div>
        </div>

        {/* CTA Buttons */}
        {canAccessQuiz && onStartQuiz ? (
          <button
            onClick={onStartQuiz}
            className="w-full bg-black text-white dark:bg-white dark:text-black px-6 py-4 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Quiz
          </button>
        ) : (
          <button
            onClick={onStartJourney}
            className="w-full bg-black text-white dark:bg-white dark:text-black px-6 py-4 rounded-xl font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Journey
          </button>
        )}
      </div>
    </motion.div>
  );
}
