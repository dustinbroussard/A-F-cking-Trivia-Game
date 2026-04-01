import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TrashTalkEvent } from '../content/trashTalk';

interface TrashTalkOverlayProps {
  event: TrashTalkEvent | null;
  message: string | null;
}

const TITLES: Record<TrashTalkEvent, string> = {
  OPPONENT_TROPHY: 'Trash Talk',
  PLAYER_FALLING_BEHIND: 'Trash Talk',
  MATCH_LOSS: 'Final Verdict',
};

export const TrashTalkOverlay: React.FC<TrashTalkOverlayProps> = ({ event, message }) => {
  if (!event || !message) return null;

  const isMatchLoss = event === 'MATCH_LOSS';
  const accentClass = isMatchLoss ? 'text-rose-300' : 'text-sky-200';
  const cardClass = isMatchLoss
    ? 'border-rose-400/45 bg-[linear-gradient(145deg,rgba(127,29,29,0.55),rgba(76,5,25,0.78))] ring-1 ring-rose-300/20 shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_48px_rgba(251,113,133,0.18)]'
    : 'border-sky-300/45 bg-[linear-gradient(145deg,rgba(56,189,248,0.24),rgba(12,74,110,0.72))] ring-1 ring-sky-200/30 shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_48px_rgba(56,189,248,0.18)]';

  return (
    <AnimatePresence>
      <motion.div
        key={`${event}-${message}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[54] flex items-center justify-center p-6 pointer-events-none"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 theme-overlay"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 0.62, backdropFilter: 'blur(4px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className={`rounded-[2rem] backdrop-blur-xl px-8 py-8 sm:px-12 sm:py-10 text-center ${cardClass}`}>
            <p className={`mb-5 text-[0.72rem] font-black uppercase tracking-[0.34em] ${accentClass}`}>
              {TITLES[event]}
            </p>
            <p className="mx-auto max-w-[18ch] text-[1.55rem] font-black leading-[1.2] text-white sm:text-[2.3rem] sm:leading-[1.16] text-balance">
              {message}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
