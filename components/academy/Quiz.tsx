'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { type QuizQuestion } from './quizData';
import { useQuizState } from '@/hooks/use-quiz-state';
import { QuizResults } from './QuizResults';
import { useActorServices } from '@/providers/ActorServiceProvider';
import { useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/lib/utils';
import type { 
  QuizStartResponse, 
  QuizWithoutAnswers, 
  QuestionWithoutAnswer,
  AnswerSubmission,
  Result_4
} from '@/lib/canisters/skill_module/skill_module.did';

interface QuizProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number, totalQuestions: number) => void;
  moduleId: bigint;
  quizId: bigint;
  totalTime?: number; // in seconds, default 90 (1 minute 30 seconds) - fallback if backend doesn't provide timeLimit
  onReviewLessons?: () => void;
  onModuleCompleted?: () => void;
}

export function Quiz({ 
  isOpen, 
  onClose, 
  onComplete,
  moduleId,
  quizId,
  totalTime = 90,
  onReviewLessons: onReviewLessonsProp,
  onModuleCompleted
}: QuizProps) {
  const { skillModuleService } = useActorServices();
  const { toast } = useToast();
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizStartedAt, setQuizStartedAt] = useState<bigint | null>(null);
  const [timeLimitNanos, setTimeLimitNanos] = useState<bigint | null>(null);

  // Calculate time remaining from backend timestamps
  const calculateTimeRemaining = (): number => {
    if (!quizStartedAt || !timeLimitNanos) {
      return totalTime; // Fallback to prop default
    }
    
    const now = BigInt(Date.now() * 1_000_000); // Convert to nanoseconds
    const endTime = quizStartedAt + timeLimitNanos;
    const remainingNanos = endTime > now ? endTime - now : BigInt(0);
    const remainingSeconds = Number(remainingNanos) / 1_000_000_000;
    
    return Math.max(0, Math.floor(remainingSeconds));
  };

  const {
    currentQuestionIndex,
    selectedAnswers,
    timeRemaining,
    isCompleted,
    startQuiz: startQuizState,
    selectAnswer,
    nextQuestion,
    submitQuiz,
    updateTimeRemaining,
  } = useQuizState(quizData || [], totalTime);

  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; totalQuestions: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef(timeRemaining);
  const submitStartTimeRef = useRef<number | null>(null);
  const lastAnswerRef = useRef<{ questionIndex: number; answerIndex: number } | null>(null);

  // Transform backend QuizWithoutAnswers to frontend QuizQuestion format
  const transformBackendQuiz = (backendQuiz: QuizWithoutAnswers): QuizQuestion[] => {
    return backendQuiz.questions.map((question: QuestionWithoutAnswer) => ({
      id: question.id.toString(),
      question: question.questionText,
      options: question.options,
      correctAnswer: 0, // Not available in QuizWithoutAnswers, backend calculates score
      lessonId: '', // Not critical for quiz functionality
    }));
  };

  // Transform frontend answers to backend AnswerSubmission format
  // Backend requires answers for ALL questions (one per question)
  const transformAnswers = (): Array<AnswerSubmission> => {
    if (!quizData) return [];
    
    // Ensure we have answers for all questions
    return quizData.map((question, index) => {
      // Check if this is the last question and we have a ref value
      let answer = selectedAnswers[index];
      if (lastAnswerRef.current && lastAnswerRef.current.questionIndex === index) {
        answer = lastAnswerRef.current.answerIndex;
      }
      
      // If no answer selected, use 0 as default (backend will mark as incorrect)
      const answerIndex = answer !== null ? answer : 0;
      
      return {
        answer: BigInt(answerIndex),
        questionId: BigInt(question.id)
      };
    });
  };

  // Fetch quiz data from backend when quiz opens
  useEffect(() => {
    if (!isOpen || quizData !== null) {
      return; // Don't fetch if not open or already fetched
    }

    const fetchQuiz = async () => {
      setIsLoadingQuiz(true);
      setQuizError(null);
      
      try {
        const response = await skillModuleService.startQuiz(moduleId, quizId);
        const { quiz, quizStartedAt, timeLimit } = response;
        
        // Store quizStartedAt and timeLimit for time calculations
        setQuizStartedAt(quizStartedAt);
        if (timeLimit && timeLimit.length > 0) {
          setTimeLimitNanos(timeLimit[0]);
        } else {
          setTimeLimitNanos(null);
        }
        
        // Transform backend quiz to frontend format
        const transformedQuestions = transformBackendQuiz(quiz);
        setQuizData(transformedQuestions);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load quiz';
        
        // Check for "Delay not met" error - show toast and close modal
        if (errorMessage.includes("Delay not met")) {
          // Extract wait time from error message (format: "Delay not met. Please wait X seconds")
          const waitTimeMatch = errorMessage.match(/Please wait (\d+) seconds/);
          const waitSeconds = waitTimeMatch ? parseInt(waitTimeMatch[1], 10) : 0;
          const formattedDuration = formatDuration(waitSeconds);
          
          toast({
            title: "Quiz Cooldown",
            description: `Please wait ${formattedDuration} before retaking the quiz.`,
            variant: "destructive"
          });
          
          // Close quiz modal
          onClose();
          return;
        }
        
        // All other errors continue to use existing error state display
        setQuizError(errorMessage);
        console.error('Error fetching quiz:', error);
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    fetchQuiz();
  }, [isOpen, moduleId, quizId, skillModuleService, totalTime]); // Removed quizData from deps to prevent re-fetch loops

  // Initialize quiz state when quiz data is loaded
  useEffect(() => {
    if (isOpen && quizData && quizData.length > 0 && !hasStarted && quizStartedAt && timeLimitNanos) {
      const initialTime = calculateTimeRemaining();
      startQuizState();
      updateTimeRemaining(initialTime);
      setHasStarted(true);
    }
  }, [isOpen, quizData, hasStarted, startQuizState, quizStartedAt, timeLimitNanos, updateTimeRemaining, totalTime]);

  // Update ref when timeRemaining changes
  useEffect(() => {
    timeRef.current = timeRemaining;
  }, [timeRemaining]);

  // Timer countdown - calculate from backend timestamps
  useEffect(() => {
    if (!isOpen || isCompleted || !hasStarted || isSubmitting || showResults || !quizStartedAt || !timeLimitNanos) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (remaining <= 0) {
        updateTimeRemaining(0);
      } else {
        updateTimeRemaining(remaining);
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isOpen, isCompleted, hasStarted, isSubmitting, showResults, quizStartedAt, timeLimitNanos, updateTimeRemaining]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && !isCompleted && hasStarted && !isSubmitting && !showResults) {
      handleSubmit();
    }
  }, [timeRemaining, isCompleted, hasStarted, isSubmitting, showResults]);

  // Handle loading screen minimum display time
  useEffect(() => {
    if (isSubmitting && submitStartTimeRef.current === null) {
      submitStartTimeRef.current = Date.now();
    }
    
    if (!isSubmitting && submitStartTimeRef.current !== null) {
      const elapsed = Date.now() - submitStartTimeRef.current;
      const minDisplayTime = 3000; // 3 seconds minimum
      
      if (elapsed < minDisplayTime) {
        const remaining = minDisplayTime - elapsed;
        const timeout = setTimeout(() => {
          submitStartTimeRef.current = null;
        }, remaining);
        
        return () => clearTimeout(timeout);
      } else {
        submitStartTimeRef.current = null;
      }
    }
  }, [isSubmitting]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quizData?.[currentQuestionIndex];
  const isLastQuestion = quizData ? currentQuestionIndex === quizData.length - 1 : false;
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== null;
  const progress = quizData ? ((currentQuestionIndex + 1) / quizData.length) * 100 : 0;

  const handleAnswerSelect = (answerIndex: number) => {
    selectAnswer(currentQuestionIndex, answerIndex);
    
    // Store the last answer in ref to ensure it's available during submit
    if (isLastQuestion) {
      lastAnswerRef.current = { questionIndex: currentQuestionIndex, answerIndex };
    }
    
    // Auto-submit on last question after ensuring state is updated
    setTimeout(() => {
      if (isLastQuestion) {
        // Use a small additional delay to ensure state is committed
        setTimeout(() => {
          handleSubmit();
        }, 100);
      } else {
        nextQuestion();
      }
    }, 600); // 600ms delay for visual feedback
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    submitStartTimeRef.current = Date.now();
    
    try {
      // Ensure we have quiz data before transforming
      if (!quizData || quizData.length === 0) {
        throw new Error('Quiz data not available');
      }
      
      // Transform answers to backend format (includes all questions)
      const answers = transformAnswers();
      
      // Clear the ref after using it
      lastAnswerRef.current = null;
      
      // Validate answers array matches quiz questions count
      if (answers.length !== quizData.length) {
        throw new Error(`Expected ${quizData.length} answers, got ${answers.length}`);
      }
      
      // Call backend answer_quiz
      const result = await skillModuleService.answerQuiz(moduleId, quizId, answers);
      
      // Handle Result type
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      const feedback = result.ok;
      
      // Parse correctAnswers array: count true values (correct answers)
      // correctAnswers is an array of booleans, one per question
      // true = correct, false = incorrect
      const correctCount = feedback.correctAnswers.filter((isCorrect) => isCorrect === true).length;
      const totalQuestions = feedback.correctAnswers.length;
      
      const quizResult = {
        score: correctCount,
        totalQuestions
      };
      
      setQuizScore(quizResult);
      
      // Ensure minimum 3 seconds loading display
      const elapsed = Date.now() - (submitStartTimeRef.current || Date.now());
      const minDisplayTime = 3000;
      const remaining = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setShowResults(true);
        setIsSubmitting(false);
        submitStartTimeRef.current = null;
        // Backend already marks module as completed when quiz passes
        // Call callback to refresh module state in parent component
        if (feedback.isCorrect && onModuleCompleted) {
          onModuleCompleted();
        }
      }, remaining);
    } catch (error) {
      // Clear ref on error too
      lastAnswerRef.current = null;
      setIsSubmitting(false);
      submitStartTimeRef.current = null;
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit quiz');
    }
  };

  const handleClose = () => {
    setHasStarted(false);
    setIsSubmitting(false);
    setShowResults(false);
    setQuizScore(null);
    setQuizData(null); // Reset quiz data on close to allow refetch
    setQuizError(null);
    setQuizStartedAt(null);
    setTimeLimitNanos(null);
    lastAnswerRef.current = null; // Clear ref on close
    submitStartTimeRef.current = null;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    onClose();
  };

  const handleTryAgain = () => {
    setShowResults(false);
    setQuizScore(null);
    setHasStarted(false);
    setIsSubmitting(false);
    setQuizData(null); // Reset quiz data to trigger refetch
    setQuizError(null);
    setQuizStartedAt(null);
    setTimeLimitNanos(null);
    lastAnswerRef.current = null; // Clear ref on retry
    submitStartTimeRef.current = null;
    // Quiz will be refetched when isOpen is true and quizData is null
  };

  const handleReviewLessons = () => {
    handleClose();
    if (onReviewLessonsProp) {
      onReviewLessonsProp();
    }
  };

  const handleBackToAcademy = () => {
    handleClose();
  };



  // Show loading state while fetching quiz
  if (isLoadingQuiz || (isOpen && !quizData)) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onClose}
            />
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
              <div className="p-6 max-h-[85vh] overflow-y-auto max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Loading quiz...</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Show error state if quiz failed to load
  if (quizError) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onClose}
            />
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
              <div className="p-6 max-h-[85vh] overflow-y-auto max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-red-500 mb-4 text-center">{quizError}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (!quizData || quizData.length === 0 || !currentQuestion) {
    if (!isSubmitting && !showResults) return null;
  }

  // Show loading screen while submitting
  if (isSubmitting) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
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
              <div className="p-8 max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  {/* Animated Spinner */}
                  <motion.div
                    className="relative w-20 h-20"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <motion.div
                      className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                  
                  {/* Pulsing Text */}
                  <motion.div
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.h3
                      className="text-xl font-bold text-foreground"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      Calculating Results...
                    </motion.h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we process your answers
                    </p>
                  </motion.div>
                  
                  {/* Progress Dots */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Show results screen
  if (showResults && quizScore) {
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
              onClick={handleClose}
            />
            <QuizResults
              score={quizScore.score}
              totalQuestions={quizScore.totalQuestions}
              onTryAgain={handleTryAgain}
              onReviewLessons={handleReviewLessons}
              onBackToAcademy={handleBackToAcademy}
            />
          </>
        )}
      </AnimatePresence>
    );
  }

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
            onClick={handleClose}
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
            <div className="p-6 max-h-[95vh] overflow-y-auto max-w-md mx-auto">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Quiz
                  </h2>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  aria-label="Close quiz"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Timer and Progress */}
              <div className="mb-6 space-y-3">
                {/* Timer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Time Remaining
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${
                    timeRemaining <= 30 ? 'text-red-500 animate-pulse' : 'text-foreground'
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {quizData?.length || 0}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {currentQuestion.question}
                </h3>

                {/* Answer Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === index;
                    const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

                    return (
                      <button
                        key={`${currentQuestionIndex}-${index}`}  // Add question index to key
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {optionLabel}
                          </div>
                          <span className="flex-1">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-500 text-center">{submitError}</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

    </AnimatePresence>
  );
}

