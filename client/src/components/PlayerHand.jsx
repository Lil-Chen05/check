import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import Card from './Card';

function slotBoxClass(size) {
  if (size === 'lg') return 'w-[90px] h-[128px]';
  if (size === 'xs') return 'w-[46px] h-[66px]';
  if (size === 'sm') return 'w-[52px] h-[74px]';
  return 'w-[70px] h-[100px]';
}

export default function PlayerHand({
  player,
  isMe,
  isActive,
  onCardClick,
  reactionActive = false,
  selectable = false,
  selectedIndex = -1,
  size = 'md',
  /** Red King: tap the name row to choose this player */
  redKingBannerPick = false,
  onRedKingSelect,
  /** Jack peek pulse (emerald) via table feedback */
  emeraldPowerSlots = [],
  /** Queen anchor + Black King peeked slot — blue ring while choosing */
  blueSelectSlots = [],
  /** Black King swap: slot that cannot be chosen as swap target */
  blackKingPeekedSlot = null,
  /** Slots to pulse from lastEventFeedback (memory / teaching) */
  slotPulses = [],
  /** Post-swap: two slots, blue↔red crossfade */
  pairSwap = null,
  /** Draw swap: hand slot red → amber */
  drawHandSwap = null,
  /** Controller second pick (queen / black king) — red ring */
  optimisticPowerSecond = null,
  /** My hand: index highlighted red before draw swap resolves */
  optimisticDrawHandIndex = null,
}) {
  const cards = player.hand || [];
  const box = slotBoxClass(size);
  const cardSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : size === 'xs' ? 'xs' : 'md';
  const gap = size === 'xs' ? 'gap-1' : size === 'sm' ? 'gap-1.5' : 'gap-2';

  const reduceMotion = useReducedMotion();
  const isPeekedHere =
    blackKingPeekedSlot?.playerId === player.id && blackKingPeekedSlot != null;


  const placeholderCount = cards.length < 7 ? 7 - cards.length : 0;

  const headerInner = (
    <>
      <div className={`w-2 h-2 rounded-full ${player.connected !== false ? 'bg-jade-600' : 'bg-gray-600'}`} />
      <span className={`text-sm font-medium truncate max-w-[100px] ${
        isActive ? 'text-antique-gold-400' : isMe ? 'text-jade-600/90' : 'text-gray-300'
      }`}>
        {player.displayName}
        {isMe && ' (You)'}
      </span>
      {isActive && (
        <span className="text-[10px] text-antique-gold-400 bg-antique-gold-600/12 rounded-full px-1.5 py-0.5 animate-pulse">
          Turn
        </span>
      )}
    </>
  );

  return (
    <div className={`flex flex-col items-center gap-2 ${isActive ? '' : ''}`}>
      {redKingBannerPick && onRedKingSelect ? (
        <button
          type="button"
          onClick={() => onRedKingSelect(player.id)}
          className="flex items-center gap-1.5 mb-1 px-2 py-1 rounded-lg border border-antique-gold-700/30 bg-midnight-800/20
                     hover:border-antique-gold-500/60 hover:bg-midnight-800/40 transition-all cursor-pointer min-h-[44px]"
        >
          {headerInner}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 mb-1 min-h-[44px]">
          {headerInner}
        </div>
      )}

      <LayoutGroup id={`hand-${player.id}`}>
        <div
          className={`flex flex-row items-end ${gap} rounded-xl border border-antique-gold-700/12 bg-midnight-900/30 px-2 py-2`}
        >
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => {
              const isPeekedCard = isPeekedHere && blackKingPeekedSlot.cardIndex === index;
              const pulseEntry = slotPulses.find(
                (sp) => sp.playerId === player.id && sp.index === index,
              );
              const slotPulseAmber = pulseEntry && pulseEntry.tone !== 'emerald';
              const slotPulseEmerald = pulseEntry?.tone === 'emerald';
              const emeraldPower = emeraldPowerSlots.some(
                (s) => s.playerId === player.id && s.index === index,
              );
              const powerEmerald = emeraldPower || slotPulseEmerald;

              let swapOverlayClass = '';
              if (pairSwap) {
                if (pairSwap.a.playerId === player.id && pairSwap.a.index === index) {
                  swapOverlayClass = 'swap-ring-overlay swap-anim-blue-to-red';
                } else if (pairSwap.b.playerId === player.id && pairSwap.b.index === index) {
                  swapOverlayClass = 'swap-ring-overlay swap-anim-red-to-blue';
                }
              }
              if (!swapOverlayClass && drawHandSwap) {
                if (drawHandSwap.playerId === player.id && drawHandSwap.index === index) {
                  swapOverlayClass = 'swap-ring-overlay swap-anim-red-to-amber';
                }
              }

              const optPowerRed =
                optimisticPowerSecond &&
                optimisticPowerSecond.playerId === player.id &&
                optimisticPowerSecond.index === index;

              const optDrawRed =
                isMe &&
                optimisticDrawHandIndex != null &&
                optimisticDrawHandIndex === index;

              const selectBlue =
                !swapOverlayClass &&
                !optPowerRed &&
                !optDrawRed &&
                blueSelectSlots.some((s) => s.playerId === player.id && s.index === index);

              const staticOverlayClass = (() => {
                if (swapOverlayClass) return '';
                if (optPowerRed || optDrawRed) {
                  return 'ring-2 ring-red-500 shadow-[0_0_12px_rgba(239,68,68,0.45)]';
                }
                if (selectBlue) {
                  return 'ring-2 ring-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.45)]';
                }
                return '';
              })();

              return (
                <div
                  key={card.id}
                  data-slot-player={player.id}
                  data-slot-index={index}
                  className={`flex flex-col items-center gap-0.5 shrink-0 rounded-md transition-shadow duration-300 ${
                    slotPulseAmber
                      ? 'ring-2 ring-amber-400/90 ring-offset-2 ring-offset-black/40 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
                      : ''
                  }`}
                >
                  {/* Peek lift: card briefly floats up when a Jack/Black-King peek fires on this slot */}
                  <motion.div
                    animate={
                      slotPulseEmerald && !reduceMotion
                        ? { y: -9, scale: 1.07 }
                        : { y: 0, scale: 1 }
                    }
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className="relative inline-flex shrink-0 rounded-lg"
                  >
                    {swapOverlayClass ? (
                      <div
                        className={`absolute inset-0 z-[2] rounded-lg ${swapOverlayClass}`}
                        aria-hidden
                      />
                    ) : staticOverlayClass ? (
                      <div
                        className={`pointer-events-none absolute inset-0 z-[2] rounded-lg ${staticOverlayClass}`}
                        aria-hidden
                      />
                    ) : null}
                    <Card
                      card={card}
                      faceUp={false}
                      size={cardSize}
                      motionPreset="static"
                      enableLayout={false}
                      onClick={onCardClick ? () => onCardClick(player.id, index, card) : undefined}
                      powerEmeraldHighlight={
                        !swapOverlayClass &&
                        !selectBlue &&
                        !optPowerRed &&
                        !optDrawRed &&
                        powerEmerald
                      }
                      highlight={
                        !swapOverlayClass &&
                        !staticOverlayClass &&
                        !powerEmerald &&
                        (selectedIndex === index || (reactionActive && (isMe || selectable)))
                      }
                      disabled={!onCardClick || isPeekedCard}
                    />
                  </motion.div>
                  <span className="text-[9px] text-antique-gold-700/35 tabular-nums leading-none">{index + 1}</span>
                </div>
              );
            })}
          </AnimatePresence>

          {placeholderCount > 0 &&
            Array.from({ length: placeholderCount }, (_, i) => {
              const slotNum = cards.length + i + 1;
              return (
                <div key={`slot-${slotNum}`} className="flex flex-col items-center gap-0.5 shrink-0">
                  <div
                    className={`${box} rounded-lg border border-dashed border-antique-gold-700/15 bg-midnight-900/15 flex items-center justify-center`}
                  />
                  <span className="text-[9px] text-antique-gold-700/25 tabular-nums leading-none">{slotNum}</span>
                </div>
              );
            })}
        </div>
      </LayoutGroup>
    </div>
  );
}
