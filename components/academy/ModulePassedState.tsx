'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Trophy } from 'lucide-react';

interface ModulePassedStateProps {
  completedAt?: bigint | null;
}

export function ModulePassedState({ completedAt }: ModulePassedStateProps) {
  // Format completion date if available
  const formatDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="mx-6 mt-6 mb-4"
    >
      <div className="w-full bg-gradient-vertical border-green-500/30 dark:border-green-500/40 p-6 shadow-lg">
        {/* Icon and Title */}
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
          >
            <Trophy className="h-8 w-8 text-black" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Quiz Completed!
            </h2>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

