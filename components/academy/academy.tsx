'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LessonCard } from './LessonCard';
import { LessonModal } from './LessonModal';
import { AcademyHero } from './AcademyHero';
import { Quiz } from './Quiz';
import { ModulePassedState } from './ModulePassedState';
import { useAcademyProgress } from '@/hooks/use-academy-progress';
import { useActorServices } from '@/providers/ActorServiceProvider';
import { useAuthStore } from '@/store/auth-store';
import { LoadingOverlay } from '@/components/layout/LoadingOverlay';
import type { ModuleWithUserState } from '@/lib/canisters/skill_module/skill_module.did';
import Image from 'next/image';

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon?: React.ReactNode;
};

export function Academy() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isLoadingModule, setIsLoadingModule] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [moduleWithUserState, setModuleWithUserState] = useState<ModuleWithUserState | null>(null);
  const { skillModuleService, isIdentityReplaced } = useActorServices();
  const { 
    isInitialized, 
    isAuthenticated, 
    openConnectModal 
  } = useAuthStore();
  const { 
    markLessonViewed, 
    isLessonViewed, 
    getProgress, 
    canAccessQuiz,
    markQuizAttempt 
  } = useAcademyProgress();

  // Fetch module id=1 on component mount
  const fetchModule = useCallback(async () => {
    // Wait for auth initialization
    if (!isInitialized) {
      return;
    }

    // If not authenticated, open connect modal
    if (!isAuthenticated) {
      openConnectModal();
      setIsLoadingModule(false);
      return;
    }

    // If authenticated, wait for identity replacement
    if (!isIdentityReplaced) {
      return;
    }

    setIsLoadingModule(true);
    try {
      const fetchedModuleWithState = await skillModuleService.getModule(1n);
      
      if (fetchedModuleWithState) {
        // Store module with user state
        setModuleWithUserState(fetchedModuleWithState);
        
        // Extract module data from ModuleWithUserState
        const moduleData = fetchedModuleWithState.moduleData;
        
        // Map Module lessons to component Lesson format
        const mappedLessons = moduleData.lessons
          .sort((a, b) => Number(a.order - b.order))
          .map((lesson) => {
            try {
              // Parse JSON data from lesson.data
              const lessonData = JSON.parse(lesson.data);
              return {
                id: lesson.id.toString(),
                title: lessonData.title || '',
                subtitle: lessonData.subtitle || '',
                content: lessonData.content || '',
                icon: lessonData.icon ? (
                  lessonData.icon.startsWith('/') ? (
                    <Image src={lessonData.icon} alt={lessonData.title || ''} width={36} height={36} />
                  ) : null
                ) : undefined,
              };
            } catch (error) {
              console.error('Error parsing lesson data:', error);
              return {
                id: lesson.id.toString(),
                title: 'Untitled Lesson',
                subtitle: '',
                content: '',
              };
            }
          });
        setLessons(mappedLessons);
      }
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setIsLoadingModule(false);
    }
  }, [isInitialized, isAuthenticated, isIdentityReplaced, skillModuleService, openConnectModal]);

  // Watch for auth initialization and identity replacement, then fetch module
  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  // Handle module completion - refetch module state after quiz passes
  const handleModuleCompleted = async () => {
    await fetchModule();
  };

  const progress = getProgress(lessons.length);
  const quizAccessible = canAccessQuiz(lessons.length);
  
  // Extract module data and completion state
  const moduleData = moduleWithUserState?.moduleData ?? null;
  const isModuleCompleted = moduleWithUserState?.isCompleted ?? false;
  const completedAt = moduleWithUserState?.completedAt?.[0] ?? null;
  
  // Extract quiz ID from module data (use first quiz if multiple exist, default to quiz ID 1)
  const quizId = moduleData?.quizzes && moduleData.quizzes.length > 0 
    ? moduleData.quizzes[0].id 
    : 1n;
  const moduleId = 1n; // Module ID is hardcoded to 1

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedLesson(null);
  };

  const handleNextLesson = () => {
    if (!selectedLesson) return;
    
    const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    const nextIndex = (currentIndex + 1) % lessons.length;
    setSelectedLesson(lessons[nextIndex]);
  };

  const handlePreviousLesson = () => {
    if (!selectedLesson) return;
    const currentIndex = lessons.findIndex(l => l.id === selectedLesson.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    setSelectedLesson(lessons[prevIndex]);
  };

  const handleStartJourney = () => {
    if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
      setIsModalOpen(true);
    }
  };

  const handleStartQuiz = () => {
    markQuizAttempt();
    setIsQuizOpen(true);
  };

  const handleQuizClose = () => {
    setIsQuizOpen(false);
  };

  const handleReviewLessons = () => {
    setIsQuizOpen(false);
    if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
      setIsModalOpen(true);
    }
  };

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    // Quiz completion is handled in Quiz component
    setIsQuizOpen(false);
  };

  return (
    <div className="min-h-screen flex justify-center">
      {/* Show loading overlay while fetching module */}
      {isLoadingModule && <LoadingOverlay />}
      
      {/* App Container */}
      <div className="w-full max-w-md min-h-screen relative overflow-hidden shadow-xl">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 backdrop-blur-md border-b border-border">
          <div className="h-14 flex items-center justify-center">
            <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">
              BOB Academy
            </h1>
          </div>
        </header>

        {/* Hero Section - Hide if module completed */}
        {!isModuleCompleted && (
          <AcademyHero 
            progress={progress} 
            onStartJourney={handleStartJourney}
            canAccessQuiz={quizAccessible}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {/* Module Passed State - Show if module completed */}
        {isModuleCompleted && (
          <ModulePassedState completedAt={completedAt} />
        )}

        {/* Lesson List */}
        <div className="px-6 pb-6">
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No lessons available</p>
            </div>
          ) : (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.1,
                  },
                },
              }}
            >
              {lessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1],
                      },
                    },
                  }}
                >
                  <LessonCard
                    lesson={lesson}
                    onClick={() => handleLessonClick(lesson)}
                    isViewed={isLessonViewed(lesson.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Lesson Modal */}
        {selectedLesson && (
          <LessonModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            lesson={selectedLesson}
            lessons={lessons}
            onNextLesson={handleNextLesson}
            onMarkViewed={markLessonViewed}
            onPreviousLesson={handlePreviousLesson}
            progress={progress}
            canAccessQuiz={quizAccessible}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {/* Quiz Modal */}
        <Quiz
          isOpen={isQuizOpen}
          onClose={handleQuizClose}
          onComplete={handleQuizComplete}
          moduleId={moduleId}
          quizId={quizId}
          onReviewLessons={handleReviewLessons}
          onModuleCompleted={handleModuleCompleted}
        />
      </div>
    </div>
  );
}

