import { AnimatePresence } from 'framer-motion';
import Card from './Card';

function slotBoxClass(size) {
  if (size === 'lg') return 'w-[90px] h-[128px]';
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
  /** Highlight one slot (e.g. Queen first pick) */
  powerSlotHighlight = null,
  /** Black King swap: slot that cannot be chosen as swap target */
  blackKingPeekedSlot = null,
}) {
  const cards = player.hand || [];
  const box = slotBoxClass(size);
  const cardSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  const gap = size === 'sm' ? 'gap-1.5' : 'gap-2';

  const isPeekedHere =
    blackKingPeekedSlot?.playerId === player.id && blackKingPeekedSlot != null;

  const placeholderCount = cards.length < 7 ? 7 - cards.length : 0;

  const headerInner = (
    <>
      <div className={`w-2 h-2 rounded-full ${player.connected !== false ? 'bg-emerald-400' : 'bg-gray-600'}`} />
      <span className={`text-sm font-medium truncate max-w-[100px] ${
        isActive ? 'text-gold-400' : isMe ? 'text-emerald-300' : 'text-gray-300'
      }`}>
        {player.displayName}
        {isMe && ' (You)'}
      </span>
      {isActive && (
        <span className="text-[10px] text-gold-400 bg-gold-400/10 rounded-full px-1.5 py-0.5 animate-pulse">
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
          className="flex items-center gap-1.5 mb-1 px-2 py-1 rounded-lg border border-gold-600/30 bg-black/20
                     hover:border-amber-400/60 hover:bg-black/40 transition-all cursor-pointer"
        >
          {headerInner}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 mb-1">
          {headerInner}
        </div>
      )}

      <div
        className={`flex flex-row items-end ${gap} rounded-xl border border-white/10 bg-black/10 px-2 py-2`}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const isPeekedCard = isPeekedHere && blackKingPeekedSlot.cardIndex === index;
            const powerHL =
              powerSlotHighlight?.playerId === player.id && powerSlotHighlight?.cardIndex === index;
            return (
              <div key={card.id} className="flex flex-col items-center gap-0.5 shrink-0">
                <Card
                  card={card}
                  faceUp={false}
                  size={cardSize}
                  onClick={onCardClick ? () => onCardClick(player.id, index, card) : undefined}
                  highlight={
                    selectedIndex === index ||
                    (reactionActive && (isMe || selectable)) ||
                    powerHL
                  }
                  disabled={!onCardClick || isPeekedCard}
                />
                <span className="text-[9px] text-gray-500 tabular-nums leading-none">{index + 1}</span>
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
                  className={`${box} rounded-lg border border-dashed border-white/12 bg-black/5 flex items-center justify-center`}
                />
                <span className="text-[9px] text-gold-600/35 tabular-nums leading-none">{slotNum}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
