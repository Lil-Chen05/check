import { motion, useReducedMotion } from 'framer-motion';

export default function DrawPile({ count, onClick, disabled, canDraw }) {
  const reduceMotion = useReducedMotion();
  const canHover = canDraw && !disabled && !reduceMotion;

  return (
    <motion.div
      whileHover={canHover ? { scale: 1.05 } : {}}
      whileTap={canDraw && !disabled ? { scale: 0.95 } : {}}
      onClick={canDraw && !disabled ? onClick : undefined}
      className={`relative flex flex-col items-center gap-2 ${
        canDraw && !disabled ? 'cursor-pointer' : ''
      }`}
    >
      <div className="relative">
        {count > 2 && (
          <div className="absolute top-1 left-1 w-[70px] h-[100px] rounded-lg card-back-pattern border border-antique-gold-700/10 opacity-40" />
        )}
        {count > 1 && (
          <div className="absolute top-0.5 left-0.5 w-[70px] h-[100px] rounded-lg card-back-pattern border border-antique-gold-700/15 opacity-60" />
        )}
        <div className={`relative w-[70px] h-[100px] rounded-lg card-back-pattern border transition-all duration-200 ${
          canDraw && !disabled
            ? 'border-antique-gold-600/60 shadow-glow'
            : 'border-antique-gold-700/20'
        }`}>
          <div className="absolute inset-[5px] rounded border border-antique-gold-700/18 flex items-center justify-center">
            <span className="text-antique-gold-600/25 font-display italic text-xl tracking-[0.1em]">C</span>
          </div>
        </div>
      </div>
      <span className="text-xs text-antique-gold-700/60">{count} cards</span>
      {canDraw && !disabled && (
        <span className="text-xs text-antique-gold-400/80 animate-pulse">Click to draw</span>
      )}
    </motion.div>
  );
}
