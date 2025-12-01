'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, Scale, Pickaxe, CheckCircle, Flame, Shield, TrendingUp } from 'lucide-react';
import { LessonCard } from './LessonCard';
import { LessonModal } from './LessonModal';
import Image from 'next/image';

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon?: React.ReactNode;
};

// Initial lesson data
const lessons: Lesson[] = [
  {
    id: 'what-is-bob',
    title: 'What is BOB?',
    subtitle: 'The first token to make ICP burn for real.',
    content: 'BOB is the first-ever proof-of-work token built on the Internet Computer, created entirely through burning ICP for computation. It represents a fully transparent, community-driven asset with zero premine, no insider allocation, and no privileged access.',
    icon: <Image src="/images/bob_logo.png" alt="BOB" width={36} height={36} />,
  },
  {
    id: 'fair-launch',
    title: 'Fair Launch Proof',
    subtitle: 'No early insiders. No secret deals. Just pure mining.',
    content: 'Every BOB in existence had to be mined by burning ICP—no team wallets, no VC rounds, no airdrops, no backdoor allocations. This places BOB among the fairest and most decentralized token launches in the entire crypto industry.',
    icon: <Scale className="h-6 w-6" />,
  },
  {
    id: 'mining-work',
    title: 'On-Chain Mining',
    subtitle: 'Mining powered by ICP burn… not electricity.',
    content: 'Miners spent ICP to buy computation (cycles) and used that on-chain power to mint BOB through real proof-of-work. The entire process was open, verifiable, and identical for every participant, giving BOB unmatched transparency.',
    icon: <Pickaxe className="h-6 w-6" />,
  },
  {
    id: 'end-of-mining',
    title: 'Fixed Supply Forever',
    subtitle: 'The door to new supply is permanently closed.',
    content: 'The mining phase is fully completed, meaning BOB now has a fixed and fully distributed supply. This eliminates emission pressure forever and makes BOB one of the rare static-supply assets on the ICP network.',
    icon: <CheckCircle className="h-6 w-6" />,
  },
  {
    id: 'deflationary',
    title: 'ICP Burn Engine',
    subtitle: 'BOB burned millions in ICP to come alive.',
    content: 'Every BOB minted required ICP to be burned, reducing the ICP supply and helping the network reach periods of net deflation. BOB is one of the few community tokens that materially strengthened the economic health of the Internet Computer.',
    icon: <Flame className="h-6 w-6" />,
  },
  {
    id: 'governance',
    title: 'NNS Secured Token',
    subtitle: 'Unruggable by design, secured by the NNS.',
    content: 'Control of BOB has been transferred to the Internet Computer\'s NNS governance system, removing single-developer risk entirely. This makes BOB immune to rug pulls, misuse, or unilateral changes—an institutional-grade safety feature.',
    icon: <Shield className="h-6 w-6" />,
  },
  {
    id: 'long-term',
    title: 'Long-Term Upside',
    subtitle: 'Scarcity, strong holders, and a growing narrative.',
    content: 'With fixed supply, fair distribution, strong long-term holders, and NNS-backed security, BOB sits as a rare and high-conviction asset in a still-early ecosystem. If ICP enters a major growth phase, BOB\'s unique origin and deflationary impact create asymmetric upside potential.',
    icon: <TrendingUp className="h-6 w-6" />,
  },
];

export function Academy() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex justify-center bg-background">
      {/* App Container */}
      <div className="w-full max-w-md min-h-screen relative overflow-hidden shadow-xl bg-card">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 backdrop-blur-md border-b border-border bg-card/80">
          <div className="h-14 flex items-center justify-center">
            <h1 className="text-lg font-bold uppercase tracking-wider text-foreground">
              BOB Academy
            </h1>
          </div>
        </header>

        {/* Lesson List */}
        <div className="px-6 py-6">
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
          />
        )}
      </div>
    </div>
  );
}

