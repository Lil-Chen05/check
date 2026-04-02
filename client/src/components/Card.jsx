import { motion } from 'framer-motion';
import { getSuitSymbol, getSuitColor, getDisplayRank } from '../utils/cardUtils';

export default function Card({
  card,
  faceUp = false,
  onClick,
  disabled = false,
  highlight = false,
  size = 'md',
  className = '',
}) {
  const showFace = faceUp && card?.rank;
  const isJoker = card?.rank === 'Joker';

  const sizes = {
    sm: 'w-[52px] h-[74px] text-xs',
    md: 'w-[70px] h-[100px] text-sm',
    lg: 'w-[90px] h-[128px] text-base',
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={!disabled && onClick ? { y: -6, scale: 1.05 } : {}}
      whileTap={!disabled && onClick ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-lg shadow-card select-none flex-shrink-0
        ${sizes[size]}
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-60' : ''}
        ${highlight ? 'ring-2 ring-gold-400 shadow-glow' : ''}
        ${className}
      `}
    >
      {showFace ? (
        <div className="absolute inset-0 rounded-lg bg-white flex flex-col justify-between p-1.5 overflow-hidden">
          {isJoker ? (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-purple-600 text-2xl">★</span>
              <span className="text-purple-600 font-bold text-[10px] mt-0.5">JOKER</span>
            </div>
          ) : (
            <>
              <div className={`flex flex-col items-start leading-none ${getSuitColor(card.suit)}`}>
                <span className="font-bold">{getDisplayRank(card.rank)}</span>
                <span className="text-[10px]">{getSuitSymbol(card.suit)}</span>
              </div>
              <div className={`text-center text-2xl ${getSuitColor(card.suit)}`}>
                {getSuitSymbol(card.suit)}
              </div>
              <div className={`flex flex-col items-end leading-none rotate-180 ${getSuitColor(card.suit)}`}>
                <span className="font-bold">{getDisplayRank(card.rank)}</span>
                <span className="text-[10px]">{getSuitSymbol(card.suit)}</span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 rounded-lg card-back-pattern border-2 border-gold-600/20">
          <div className="absolute inset-2 rounded border border-gold-600/15 flex items-center justify-center">
            <span className="text-gold-600/30 font-display font-bold text-lg">C</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
