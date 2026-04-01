import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface HeckleOverlayProps {
  message: string | null;
  visible: boolean;
}

export const HeckleOverlay: React.FC<HeckleOverlayProps> = ({ message, visible }) => {
  if (!visible || !message) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] flex items-center justify-center p-6 pointer-events-none"
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 theme-overlay"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 0.7, backdropFilter: 'blur(5px)' }}
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
          <div className="rounded-[2rem] border border-amber-300/45 bg-[linear-gradient(145deg,rgba(255,243,176,0.22),rgba(120,53,15,0.34))] min-h-[12rem] px-8 py-8 sm:min-h-[13.5rem] sm:px-12 sm:py-10 text-center shadow-[0_24px_70px_rgba(0,0,0,0.42),0_0_48px_rgba(251,191,36,0.18)] ring-1 ring-amber-200/30 backdrop-blur-xl">
            <p className="mb-5 text-[0.72rem] font-black uppercase tracking-[0.34em] text-amber-200/95">
              Commentary Booth
            </p>
            <p className="mx-auto max-w-[18ch] text-[1.55rem] font-black leading-[1.2] text-amber-50 sm:text-[2.3rem] sm:leading-[1.16] whitespace-pre-line text-balance">
              {message}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
