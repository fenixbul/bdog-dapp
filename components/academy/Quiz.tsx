'use client';

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { quizQuestions, type QuizQuestion } from './quizData';
import { useQuizState } from '@/hooks/use-quiz-state';
import { QuizResults } from './QuizResults';
import { useAcademyProgress } from '@/hooks/use-academy-progress';

interface QuizProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number, totalQuestions: number) => void;
  totalTime?: number; // in seconds, default 90 (1 minute 30 seconds)
}

export function Quiz({ 
  isOpen, 
  onClose, 
  onComplete,
  totalTime = 90 
}: QuizProps) {
  const {
    currentQuestionIndex,
    selectedAnswers,
    timeRemaining,
    isCompleted,
    startQuiz,
    selectAnswer,
    nextQuestion,
    submitQuiz,
    updateTimeRemaining,
  } = useQuizState(quizQuestions, totalTime);

  const [hasStarted, setHasStarted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; totalQuestions: number } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef(timeRemaining);
  const { markQuizCompleted, isRewardClaimed, markRewardClaimed } = useAcademyProgress();

  // Initialize quiz when opened
  useEffect(() => {
    if (isOpen && !hasStarted) {
      startQuiz();
      setHasStarted(true);
    }
  }, [isOpen, hasStarted, startQuiz]);

  // Update ref when timeRemaining changes
  useEffect(() => {
    timeRef.current = timeRemaining;
  }, [timeRemaining]);

  // Timer countdown - fixed with useRef
  useEffect(() => {
    if (!isOpen || isCompleted || !hasStarted || showReview || showResults) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const newTime = timeRef.current - 1;
      if (newTime <= 0) {
        updateTimeRemaining(0);
      } else {
        updateTimeRemaining(newTime);
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isOpen, isCompleted, hasStarted, showReview, showResults, updateTimeRemaining]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining <= 0 && !isCompleted && hasStarted && !showReview && !showResults) {
      try {
        const result = submitQuiz();
        setQuizScore(result);
        setShowResults(true);
        setSubmitError(null);
        if (result.score >= Math.ceil(result.totalQuestions * 0.8)) {
          markQuizCompleted();
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to submit quiz');
      }
    }
  }, [timeRemaining, isCompleted, hasStarted, showReview, showResults, submitQuiz, markQuizCompleted]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== null;
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    selectAnswer(currentQuestionIndex, answerIndex);
    // Auto-advance to next question after a short delay for visual feedback
    setTimeout(() => {
      if (isLastQuestion) {
        setShowReview(true);
      } else {
        nextQuestion();
      }
    }, 600); // 600ms delay for visual feedback
  };


  const handleFinalSubmit = () => {
    try {
      const result = submitQuiz();
      setQuizScore(result);
      setShowResults(true);
      setSubmitError(null);
      if (result.score >= Math.ceil(result.totalQuestions * 0.8)) {
        markQuizCompleted();
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit quiz');
    }
  };

  const handleBackToQuiz = () => {
    setShowReview(false);
  };

  const handleGoToQuestion = (index: number) => {
    setShowReview(false);
    // Navigate to question - need to update currentQuestionIndex
    // For simplicity, we'll just close review and user can navigate
    setShowReview(false);
  };

  const handleClose = () => {
    setHasStarted(false);
    setShowReview(false);
    setShowResults(false);
    setQuizScore(null);
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
    setShowReview(false);
    startQuiz();
    setHasStarted(true);
  };

  const handleReviewLessons = () => {
    handleClose();
    // Scroll to top or trigger lesson review - handled by parent
  };

  const handleBackToAcademy = () => {
    handleClose();
  };

  const handleClaimReward = async () => {
    try {
      // Placeholder for actual reward claiming logic
      // In future: integrate with token service/wallet
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      markRewardClaimed();
    } catch (error) {
      throw error; // Let QuizResults handle the error
    }
  };

  const unansweredCount = selectedAnswers.filter(answer => answer === null).length;

  if (!currentQuestion && !showReview && !showResults) return null;

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
              onClaimReward={handleClaimReward}
              isRewardClaimed={isRewardClaimed()}
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
            <div className="p-6 max-h-[85vh] overflow-y-auto max-w-md mx-auto">
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
                {timeRemaining <= 30 && timeRemaining > 0 && (
                  <div className="text-xs text-red-500 font-medium text-center">
                    Time running out!
                  </div>
                )}

                {/* Progress Indicator */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {quizQuestions.length}
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
                        key={index}
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

              {/* Info message */}
              {!hasSelectedAnswer && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    Select an answer to continue
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Review Screen */}
      {showReview && (
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Review Answers</h2>
              <button
                onClick={handleBackToQuiz}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Back to quiz"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Review List */}
            <div className="mb-6 space-y-3">
              {quizQuestions.map((question, index) => {
                const selectedAnswer = selectedAnswers[index];
                const hasAnswer = selectedAnswer !== null;
                const optionLabel = hasAnswer ? String.fromCharCode(65 + selectedAnswer) : '—';
                const answerText = hasAnswer ? question.options[selectedAnswer] : 'Not answered';

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      hasAnswer
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-red-500/30 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        hasAnswer
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-red-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-2">{question.question}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            hasAnswer ? 'text-foreground' : 'text-red-500'
                          }`}>
                            {optionLabel}: {answerText}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {unansweredCount === 0 ? (
                  <span className="text-green-500 font-medium">All questions answered</span>
                ) : (
                  <span className="text-red-500 font-medium">
                    {unansweredCount} question{unansweredCount > 1 ? 's' : ''} unanswered
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={handleFinalSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <span>Submit Quiz</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

