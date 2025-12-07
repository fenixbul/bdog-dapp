export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index
  lessonId: string; // links to lesson
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'Why BOB special?',
    options: [
      'VC money start',
      'Born from ICP burn',
      'Big team premine',
      'Secret airdrop crew',
    ],
    correctAnswer: 1, // B
    lessonId: 'what-is-bob',
  },
  {
    id: 'quiz-2',
    question: 'Why fair launch?',
    options: [
      'Dev stash hidden',
      'Only whales mined',
      'All mined same rules',
      'Exchange drop first',
    ],
    correctAnswer: 2, // C
    lessonId: 'fair-launch',
  },
  {
    id: 'quiz-3',
    question: 'Mining cost was?',
    options: [
      'GPUs + power',
      'Gas fees only',
      'ICP → cycles burn',
      'Stake tokens',
    ],
    correctAnswer: 2, // C
    lessonId: 'mining-work',
  },
  {
    id: 'quiz-4',
    question: 'Supply now what?',
    options: [
      'Inflates forever',
      'New mining coming',
      'Fixed. Done. Locked.',
      'Depends on demand',
    ],
    correctAnswer: 2, // C
    lessonId: 'end-of-mining',
  },
  {
    id: 'quiz-5',
    question: 'How BOB burn ICP?',
    options: [
      'Trading fees',
      'Mining = burn ICP',
      'Staking events',
      'Dev fund burn',
    ],
    correctAnswer: 1, // B
    lessonId: 'deflationary',
  },
  {
    id: 'quiz-6',
    question: 'Why unruggable?',
    options: [
      'Multi-sig bros',
      'NNS owns control',
      'Dev promise only',
      'Community vibe',
    ],
    correctAnswer: 1, // B
    lessonId: 'governance',
  },
  {
    id: 'quiz-7',
    question: 'Why long-term hype?',
    options: [
      'Infinite supply lol',
      'Pump on vibes',
      'Fixed + strong holders',
      'Mint whenever',
    ],
    correctAnswer: 2, // C
    lessonId: 'long-term',
  },
];


