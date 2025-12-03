'use client';

import { useState, useCallback, useRef } from 'react';
import type { QuizQuestion } from '@/components/academy/quizData';

interface QuizState {
  currentQuestionIndex: number;
  selectedAnswers: (number | null)[];
  timeRemaining: number;
  isCompleted: boolean;
}

interface QuizResult {
  score: number;
  totalQuestions: number;
}

export function useQuizState(
  questions: QuizQuestion[],
  totalTimeSeconds: number
) {
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    selectedAnswers: new Array(questions.length).fill(null),
    timeRemaining: totalTimeSeconds,
    isCompleted: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const startQuiz = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      selectedAnswers: new Array(questions.length).fill(null),
      timeRemaining: totalTimeSeconds,
      isCompleted: false,
    });
  }, [questions.length, totalTimeSeconds]);

  const selectAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setState((prev) => {
      const newSelectedAnswers = [...prev.selectedAnswers];
      newSelectedAnswers[questionIndex] = answerIndex;
      return {
        ...prev,
        selectedAnswers: newSelectedAnswers,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex >= questions.length) {
        return {
          ...prev,
          isCompleted: true,
        };
      }
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
      };
    });
  }, [questions.length]);

  const previousQuestion = useCallback(() => {
    setState((prev) => {
      const prevIndex = prev.currentQuestionIndex - 1;
      if (prevIndex < 0) {
        return prev;
      }
      return {
        ...prev,
        currentQuestionIndex: prevIndex,
      };
    });
  }, []);

  const submitQuiz = useCallback((): QuizResult => {
    // Calculate score from current state before updating
    const currentAnswers = stateRef.current.selectedAnswers;
    let score = 0;
    questions.forEach((question, index) => {
      const selectedAnswer = currentAnswers[index];
      if (selectedAnswer !== null && selectedAnswer === question.correctAnswer) {
        score++;
      }
    });
    
    // Update state to completed
    setState((prev) => ({
      ...prev,
      isCompleted: true,
    }));
    
    return {
      score,
      totalQuestions: questions.length,
    };
  }, [questions]);

  const updateTimeRemaining = useCallback((seconds: number) => {
    setState((prev) => {
      if (seconds <= 0) {
        return {
          ...prev,
          timeRemaining: 0,
          isCompleted: true,
        };
      }
      return {
        ...prev,
        timeRemaining: seconds,
      };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    startQuiz();
  }, [startQuiz]);

  return {
    ...state,
    startQuiz,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    updateTimeRemaining,
    resetQuiz,
  };
}

