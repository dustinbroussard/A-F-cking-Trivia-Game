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
  if (!event) return null;

  const isMatchLoss = event === 'MATCH_LOSS';
  const displayMessage = message?.trim() || 'Couldn’t format commentary.';
  const accentClass = isMatchLoss ? 'text-rose-200' : 'text-sky-100';
  const cardClass = isMatchLoss
    ? 'border-rose-300/40 bg-[linear-gradient(155deg,rgba(122,20,39,0.96),rgba(66,10,24,0.98))] shadow-[0_22px_56px_rgba(0,0,0,0.34),0_0_24px_rgba(244,63,94,0.14)] ring-1 ring-rose-100/10'
    : 'border-sky-300/40 bg-[linear-gradient(155deg,rgba(9,78,132,0.97),rgba(8,47,73,0.98))] shadow-[0_22px_56px_rgba(0,0,0,0.32),0_0_24px_rgba(14,165,233,0.12)] ring-1 ring-sky-100/10';

  return (
    <AnimatePresence>
      <motion.div
        key={`${event}-${displayMessage}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[54] flex items-center justify-center p-6 pointer-events-none"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 theme-overlay"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 0.5, backdropFilter: 'blur(3px)' }}
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
          <div className={`relative overflow-hidden rounded-[2rem] px-6 py-6 sm:px-8 sm:py-8 text-center ${cardClass}`}>
            <div
              aria-hidden="true"
              className={`absolute inset-0 ${isMatchLoss ? 'bg-[radial-gradient(circle_at_top,rgba(253,164,175,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.12))]' : 'bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.12))]'}`}
            />
            <div className="absolute inset-x-0 top-0 h-px bg-white/18" aria-hidden="true" />
            <div className={`relative rounded-[1.5rem] border px-5 py-5 sm:px-7 sm:py-6 ${isMatchLoss ? 'border-rose-950/18 bg-[linear-gradient(180deg,rgba(76,5,25,0.16),rgba(40,4,16,0.32))]' : 'border-sky-950/18 bg-[linear-gradient(180deg,rgba(3,37,65,0.14),rgba(2,24,43,0.34))]'} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}>
            <p className={`mb-4 text-[0.7rem] font-black uppercase tracking-[0.3em] ${accentClass}`}>
              {TITLES[event]}
            </p>
            <p className="mx-auto max-w-[19ch] text-[1.42rem] font-black leading-[1.28] text-white sm:text-[2.1rem] sm:leading-[1.2] text-balance">
              {displayMessage}
            </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
