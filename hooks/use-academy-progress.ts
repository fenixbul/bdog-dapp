'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'academy-viewed-lessons';
const QUIZ_ATTEMPTS_KEY = 'academy-quiz-attempts';
const REWARD_CLAIMED_KEY = 'academy-reward-claimed';

function loadViewedLessons(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set<string>();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const lessonIds = JSON.parse(stored) as string[];
      return new Set(lessonIds);
    }
  } catch (error) {
    console.error('Failed to load viewed lessons from localStorage:', error);
  }

  return new Set<string>();
}

function saveViewedLessons(viewedLessons: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const lessonIds = Array.from(viewedLessons);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessonIds));
  } catch (error) {
    console.error('Failed to save viewed lessons to localStorage:', error);
  }
}

function loadQuizAttempts(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    const stored = localStorage.getItem(QUIZ_ATTEMPTS_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error('Failed to load quiz attempts from localStorage:', error);
    return 0;
  }
}

function saveQuizAttempts(attempts: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(QUIZ_ATTEMPTS_KEY, String(attempts));
  } catch (error) {
    console.error('Failed to save quiz attempts to localStorage:', error);
  }
}

function loadRewardClaimed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const stored = localStorage.getItem(REWARD_CLAIMED_KEY);
    return stored === 'true';
  } catch (error) {
    console.error('Failed to load reward claim status from localStorage:', error);
    return false;
  }
}

function saveRewardClaimed(claimed: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(REWARD_CLAIMED_KEY, String(claimed));
  } catch (error) {
    console.error('Failed to save reward claim status to localStorage:', error);
  }
}

export function useAcademyProgress() {
  const [viewedLessons, setViewedLessons] = useState<Set<string>>(() => loadViewedLessons());
  const [quizAttempts, setQuizAttempts] = useState<number>(() => loadQuizAttempts());
  const [rewardClaimed, setRewardClaimed] = useState<boolean>(() => loadRewardClaimed());

  // Sync with localStorage on mount
  useEffect(() => {
    setViewedLessons(loadViewedLessons());
    setQuizAttempts(loadQuizAttempts());
    setRewardClaimed(loadRewardClaimed());
  }, []);

  const markLessonViewed = useCallback((lessonId: string) => {
    setViewedLessons((prev) => {
      // Check if already viewed to prevent unnecessary updates
      if (prev.has(lessonId)) {
        return prev;
      }
      const updated = new Set(prev);
      updated.add(lessonId);
      saveViewedLessons(updated);
      return updated;
    });
  }, []);

  const isLessonViewed = (lessonId: string): boolean => {
    return viewedLessons.has(lessonId);
  };

  const getProgress = (totalLessons: number): number => {
    if (totalLessons === 0) return 0;
    return Math.round((viewedLessons.size / totalLessons) * 100);
  };

  const resetProgress = () => {
    const emptySet = new Set<string>();
    setViewedLessons(emptySet);
    saveViewedLessons(emptySet);
  };

  const areAllLessonsViewed = useCallback((totalLessons: number): boolean => {
    return viewedLessons.size === totalLessons && totalLessons > 0;
  }, [viewedLessons.size]);

  const canAccessQuiz = useCallback((totalLessons: number): boolean => {
    return areAllLessonsViewed(totalLessons);
  }, [areAllLessonsViewed]);

  const markQuizAttempt = useCallback(() => {
    setQuizAttempts((prev) => {
      const newAttempts = prev + 1;
      saveQuizAttempts(newAttempts);
      return newAttempts;
    });
  }, []);

  const markRewardClaimed = useCallback(() => {
    setRewardClaimed(true);
    saveRewardClaimed(true);
  }, []);

  const isRewardClaimed = (): boolean => {
    return rewardClaimed;
  };

  return {
    viewedLessons,
    markLessonViewed,
    isLessonViewed,
    getProgress,
    resetProgress,
    areAllLessonsViewed,
    canAccessQuiz,
    quizAttempts,
    markQuizAttempt,
    rewardClaimed,
    markRewardClaimed,
    isRewardClaimed,
  };
}

