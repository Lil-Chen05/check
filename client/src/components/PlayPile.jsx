import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

export default function PlayPile({
  topCard,
  reactionHint,
  reactionArmed,
  count,
  canTakeFromPile = false,
  onTakeFromPile,
}) {
  const strong = reactionArmed;
  const soft = reactionHint && !strong;
  const canTop = canTakeFromPile && typeof onTakeFromPile === 'function';

  const pileInner = (
    <>
      <div
        className={`relative rounded-xl p-1 transition-all duration-300 ${
          strong
            ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse-slow'
            : soft
              ? 'ring-1 ring-amber-500/40'
              : ''
        }`}
      >
        {count > 1 && (
          <div className="absolute top-1.5 left-1.5 w-[70px] h-[100px] rounded-lg bg-white/20 border border-white/10" />
        )}
        <AnimatePresence mode="wait">
          {topCard ? (
            <motion.div
              key={topCard.id}
              initial={{ scale: 0.5, rotateZ: -15, opacity: 0 }}
              animate={{ scale: 1, rotateZ: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`rounded-lg transition-all duration-200 ${
                canTop ? 'ring-2 ring-gold-400/50 shadow-glow' : ''
              }`}
            >
              <Card card={topCard} faceUp size="md" />
            </motion.div>
          ) : (
            <div
              className={`w-[70px] h-[100px] rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                canTop
                  ? 'border-gold-400/50 shadow-glow'
                  : 'border-white/10'
              }`}
            >
              <span className="text-gray-600 text-xs">Pile</span>
            </div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-xs text-gray-400">Play Pile</span>
      {canTop && (
        <span className="text-xs text-gold-400 animate-pulse">Click to Top</span>
      )}
    </>
  );

  if (canTop) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onTakeFromPile()}
        className="relative flex flex-col items-center gap-2 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTakeFromPile();
          }
        }}
        aria-label="Take top of play pile"
      >
        {pileInner}
      </motion.div>
    );
  }

  return <div className="relative flex flex-col items-center gap-2">{pileInner}</div>;
}
