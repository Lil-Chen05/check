import { motion } from 'framer-motion';

export default function DrawPile({ count, onClick, disabled, canDraw }) {
  return (
    <motion.div
      whileHover={canDraw && !disabled ? { scale: 1.05 } : {}}
      whileTap={canDraw && !disabled ? { scale: 0.95 } : {}}
      onClick={canDraw && !disabled ? onClick : undefined}
      className={`relative flex flex-col items-center gap-2 ${
        canDraw && !disabled ? 'cursor-pointer' : ''
      }`}
    >
      <div className="relative">
        {count > 2 && (
          <div className="absolute top-1 left-1 w-[70px] h-[100px] rounded-lg card-back-pattern border border-gold-600/10 opacity-40" />
        )}
        {count > 1 && (
          <div className="absolute top-0.5 left-0.5 w-[70px] h-[100px] rounded-lg card-back-pattern border border-gold-600/15 opacity-60" />
        )}
        <div className={`relative w-[70px] h-[100px] rounded-lg card-back-pattern border-2 transition-all duration-200 ${
          canDraw && !disabled
            ? 'border-gold-400/50 shadow-glow'
            : 'border-gold-600/20'
        }`}>
          <div className="absolute inset-2 rounded border border-gold-600/15 flex items-center justify-center">
            <span className="text-gold-600/40 font-display font-bold text-lg">C</span>
          </div>
        </div>
      </div>
      <span className="text-xs text-gray-400">{count} cards</span>
      {canDraw && !disabled && (
        <span className="text-xs text-gold-400 animate-pulse">Click to draw</span>
      )}
    </motion.div>
  );
}
