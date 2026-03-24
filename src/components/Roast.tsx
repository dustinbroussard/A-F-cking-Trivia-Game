import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag } from 'lucide-react';
import { getRandomQuestionFlagLine } from '../content/questionFlagCopy';
import { flagQuestion } from '../services/questionFlags';

interface RoastProps {
  explanation: string;
  isCorrect: boolean;
  questionId: string;
  userId?: string | null;
  gameId?: string | null;
  onClose: () => void;
}

export const Roast: React.FC<RoastProps> = ({ explanation, isCorrect, questionId, userId, gameId, onClose }) => {
  const [flagLine, setFlagLine] = useState(() => getRandomQuestionFlagLine());
  const [isFlagged, setIsFlagged] = useState(false);
  const [isSavingFlag, setIsSavingFlag] = useState(false);

  useEffect(() => {
    setFlagLine(getRandomQuestionFlagLine());
    setIsFlagged(false);
    setIsSavingFlag(false);
  }, [questionId]);

  const handleFlag = async () => {
    if (isFlagged || isSavingFlag) return;

    setIsSavingFlag(true);
    try {
      await flagQuestion({ questionId, userId, gameId });
      setIsFlagged(true);
    } catch (error) {
      console.error('[questionFlag] Failed to log flag:', error);
    } finally {
      setIsSavingFlag(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="roast-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-6 pt-6 pb-28 sm:pb-32 theme-overlay backdrop-blur-sm pointer-events-auto"
      >
        <div className={`p-10 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.25)] max-w-md w-full text-center transition-all duration-300 ease-in-out ${
          isCorrect ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-rose-950/40 border-rose-500/30'
        }`}>
          <h3 className={`text-4xl font-black uppercase tracking-tight mb-4 ${
            isCorrect ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isCorrect ? 'Correct!' : 'Wrong!'}
          </h3>
          <p className="text-lg font-semibold leading-relaxed mb-3">
            {explanation}
          </p>
          <button type="button"
            onClick={onClose}
            className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:scale-[1.02] transition-all duration-300 ease-in-out shadow-lg ${
              isCorrect ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/25' : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/25'
            }`}
          >
            Continue
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.08, duration: 0.24, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        >
          <div className="mx-auto max-w-lg">
            <div className="pointer-events-none h-10 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            <div className="pointer-events-auto flex items-center justify-between gap-4 px-2 py-2">
              <p className="min-w-0 text-[11px] leading-relaxed theme-text-muted opacity-85">
                {flagLine}
              </p>

              <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-full px-3 py-2 theme-text-secondary transition-opacity duration-200 hover:opacity-100 active:scale-[0.98]">
                <input
                  type="checkbox"
                  checked={isFlagged}
                  disabled={isFlagged || isSavingFlag}
                  onChange={handleFlag}
                  className="h-4 w-4 rounded border-white/25 bg-transparent"
                />
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <Flag className="h-3.5 w-3.5" />
                  {isFlagged ? 'Flagged' : isSavingFlag ? 'Flagging...' : 'Flag this question'}
                </span>
              </label>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
