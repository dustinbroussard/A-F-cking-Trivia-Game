import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCcw, Trophy } from 'lucide-react';
import { ResultCard } from './ResultCard';

interface EndgameOverlayProps {
  isOpen: boolean;
  isWinner: boolean;
  winnerName: string;
  loserName: string;
  winnerScore: number;
  loserScore: number;
  winnerTrophies: number;
  loserTrophies: number;
  trophyTarget: number;
  message: string;
  isGeneratingMessage: boolean;
  canPlayAgain: boolean;
  isStartingGame: boolean;
  onPlayAgain: () => void;
  onExitToLobby: () => void;
}

export const EndgameOverlay: React.FC<EndgameOverlayProps> = ({
  isOpen,
  isWinner,
  winnerName,
  loserName,
  winnerScore,
  loserScore,
  winnerTrophies,
  loserTrophies,
  trophyTarget,
  message,
  isGeneratingMessage,
  canPlayAgain,
  isStartingGame,
  onPlayAgain,
  onExitToLobby,
}) => {
  const eyebrow = isWinner ? 'Victory Lap' : 'Closing Remarks';
  const statusLine = isWinner
    ? `You took all ${trophyTarget} trophies.`
    : `${winnerName} got to all ${trophyTarget} trophies first.`;
  const summary = `${winnerName} ${winnerTrophies}/${trophyTarget} trophies, ${winnerScore} points. ${loserName} ${loserTrophies}/${trophyTarget}, ${loserScore} points.`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="endgame-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[58] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 theme-overlay"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 0.7, backdropFilter: 'blur(6px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="endgame-overlay-title"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl"
          >
            <ResultCard
              variant="endgame"
              label={eyebrow}
              className="w-full"
              body={
                <div className="endgame-card__content">
                  <h2 id="endgame-overlay-title" className="sr-only">
                    Game Over
                  </h2>
                  <Trophy className="endgame-card__trophy" aria-hidden="true" />

                  {isGeneratingMessage ? (
                    <div className="endgame-card__loading" aria-live="polite">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Preparing one last cheap shot...</span>
                    </div>
                  ) : (
                    <p className="endgame-card__message">
                      {message}
                    </p>
                  )}

                  <p className="endgame-card__status">{statusLine}</p>
                  <p className="endgame-card__summary">{summary}</p>

                  <div className="endgame-card__actions">
                    {canPlayAgain ? (
                      <button
                        type="button"
                        onClick={onPlayAgain}
                        disabled={isStartingGame}
                        className="endgame-card__button endgame-card__button--primary"
                      >
                        {isStartingGame ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCcw className="h-5 w-5" />}
                        Play Again
                      </button>
                    ) : (
                      <p className="endgame-card__waiting">Waiting for host to play again...</p>
                    )}

                    <button
                      type="button"
                      onClick={onExitToLobby}
                      disabled={isStartingGame}
                      className="endgame-card__button endgame-card__button--secondary"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Exit to Lobby
                    </button>
                  </div>
                </div>
              }
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
