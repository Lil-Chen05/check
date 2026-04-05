import { AnimatePresence, motion } from 'framer-motion';

/**
 * Floating event log — top-right corner of the game board.
 * Shows the last few game actions as one-line text that fades out after ~5 s.
 * Purely informational; pointer-events disabled so it never blocks interaction.
 */
export default function EventLog({ entries }) {
  if (!entries?.length) return null;

  return (
    <div
      className="absolute top-2 right-2 z-20 flex flex-col gap-1 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Recent game events"
    >
      <AnimatePresence initial={false}>
        {entries.map(entry => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: 14, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="
              max-w-[170px] text-right text-[10px] leading-snug
              text-antique-gold-600/65 bg-midnight-950/70 backdrop-blur-sm
              rounded px-2 py-0.5 border border-antique-gold-700/15
            "
          >
            {entry.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
