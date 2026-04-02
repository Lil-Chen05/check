import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { getSuitSymbol, getSuitColor, getDisplayRank } from '../utils/cardUtils';

export default function Card({
  card,
  faceUp = false,
  onClick,
  disabled = false,
  highlight = false,
  /** Match Resolve button: shared power / peek teaching cue */
  powerEmeraldHighlight = false,
  /** Drawn card in holding area — amber / yellow ring */
  drawHoldingAccent = false,
  size = 'md',
  className = '',
  /** FLIP layout (use sparingly — e.g. pile). Default off to reduce main-thread work on hands. */
  enableLayout = false,
  /** interactive: enter/exit motion. static: no mount choreography (table hands). */
  motionPreset = 'interactive',
}) {
  const showFace = faceUp && card?.rank;
  const isJoker = card?.rank === 'Joker';
  const reduceMotion = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFinePointer(mq.matches);
    const fn = () => setFinePointer(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const sizes = {
    xs: 'w-[46px] h-[66px] text-[10px]',
    sm: 'w-[52px] h-[74px] text-xs',
    md: 'w-[70px] h-[100px] text-sm',
    lg: 'w-[90px] h-[128px] text-base',
  };

  const layoutOn = enableLayout && !reduceMotion;
  const showEnterExit = motionPreset === 'interactive' && !reduceMotion;
  const hoverMotion =
    finePointer && !reduceMotion && !disabled && onClick
      ? { y: -4, scale: 1.03 }
      : undefined;

  return (
    <motion.div
      layout={layoutOn}
      initial={showEnterExit ? { scale: 0.92, opacity: 0.85 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={showEnterExit ? { scale: 0.92, opacity: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      whileHover={hoverMotion}
      whileTap={!disabled && onClick ? { scale: 0.97 } : undefined}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-lg shadow-card select-none flex-shrink-0
        ${sizes[size] || sizes.md}
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${disabled && !powerEmeraldHighlight ? 'opacity-60' : ''}
        ${drawHoldingAccent
          ? 'ring-2 ring-amber-400/90 shadow-[0_0_14px_rgba(251,191,36,0.45)]'
          : powerEmeraldHighlight
            ? 'ring-2 ring-emerald-400/90 shadow-[0_0_16px_rgba(52,211,153,0.5)]'
            : highlight
              ? 'ring-2 ring-gold-400 shadow-glow'
              : ''}
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
