import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

const ROLE_LABEL = {
  reacted: 'Reacted with',
  target: 'Target card',
  offered: 'Offered in trade',
  called: 'Blind call',
};

export default function ReactionOverlay({ reactionWindow, lastResult, cardReveal }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!reactionWindow?.active) {
      setTimeLeft(0);
      return;
    }

    const duration = reactionWindow.duration || 2500;
    const startTime = reactionWindow.startTime || Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [reactionWindow]);

  const progress = reactionWindow?.active
    ? timeLeft / (reactionWindow.duration || 2500)
    : 0;

  return (
    <>
      {/* Everyone sees played / steal cards for 3s */}
      <AnimatePresence>
        {cardReveal?.cards?.length > 0 && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[35] flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-4 px-6 py-5 rounded-2xl bg-felt-900/95 border border-gold-500/40 shadow-2xl max-w-[95vw]">
              <p className="text-gold-300 text-xs font-semibold tracking-widest uppercase">
                Revealed
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {cardReveal.cards.map((c, i) => (
                  <div key={`${c.id ?? i}-${c.role ?? i}`} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gold-500/80 uppercase tracking-wide">
                      {ROLE_LABEL[c.role] || 'Card'}
                    </span>
                    <Card card={c} faceUp size="lg" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer bar */}
      <AnimatePresence>
        {reactionWindow?.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-20 h-1.5"
          >
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction result toast */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`absolute top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-xl shadow-2xl text-sm font-bold border ${
              lastResult.stealGiveCompleted ||
              lastResult.needStealGive ||
              (lastResult.correct && !lastResult.penalty)
                ? 'bg-emerald-600/90 border-emerald-400/50 text-white'
                : 'bg-red-600/90 border-red-400/50 text-white'
            }`}
          >
            <div className="text-center">
              <span className="text-lg mr-2">
                {lastResult.needStealGive ? '★' : lastResult.correct && !lastResult.penalty ? '✓' : '✗'}
              </span>
              {lastResult.reactorName}
              {lastResult.needStealGive
                ? ` — right! Give ${lastResult.victimName || 'them'} one of your cards.`
                : lastResult.stealGiveCompleted
                  ? ' — trade complete.'
                  : lastResult.correct && !lastResult.penalty
                    ? ' matched successfully!'
                    : lastResult.penalty
                      ? ` — ${lastResult.reason || 'Penalty card drawn'}`
                      : ' failed reaction'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
