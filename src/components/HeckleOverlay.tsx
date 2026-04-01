import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface HeckleOverlayProps {
  message: string | null;
  visible: boolean;
}

export const HeckleOverlay: React.FC<HeckleOverlayProps> = ({ message, visible }) => {
  const displayMessage = message?.trim() || 'Couldn’t format commentary.';
  if (!visible) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={displayMessage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] flex items-center justify-center p-6 pointer-events-none"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 theme-overlay"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 0.56, backdropFilter: 'blur(3px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.965 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-300/40 bg-[linear-gradient(155deg,rgba(109,58,13,0.96),rgba(58,30,7,0.96))] min-h-[12rem] px-6 py-6 sm:min-h-[13.25rem] sm:px-8 sm:py-8 text-center shadow-[0_22px_60px_rgba(0,0,0,0.34),0_0_28px_rgba(245,158,11,0.14)] ring-1 ring-amber-100/10">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(252,211,77,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.12))]"
            />
            <div className="absolute inset-x-0 top-0 h-px bg-amber-100/25" aria-hidden="true" />
            <div className="relative rounded-[1.5rem] border border-black/12 bg-[linear-gradient(180deg,rgba(29,18,6,0.12),rgba(17,10,3,0.28))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-7 sm:py-6">
            <p className="mb-4 text-[0.7rem] font-black uppercase tracking-[0.3em] text-amber-200/92">
              Commentary Booth
            </p>
            <p className="mx-auto max-w-[19ch] text-[1.45rem] font-black leading-[1.28] text-amber-50 sm:text-[2.15rem] sm:leading-[1.2] whitespace-pre-line text-balance">
              {displayMessage}
            </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
