import { AnimatePresence } from 'framer-motion';
import Card from './Card';

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

  const isPeekedHere =
    blackKingPeekedSlot?.playerId === player.id && blackKingPeekedSlot != null;

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

      <div className={`flex gap-1.5 ${isMe ? 'gap-2' : 'gap-1'}`}>
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const isPeekedCard = isPeekedHere && blackKingPeekedSlot.cardIndex === index;
            const powerHL =
              powerSlotHighlight?.playerId === player.id && powerSlotHighlight?.cardIndex === index;
            return (
              <Card
                key={card.id}
                card={card}
                faceUp={false}
                size={isMe ? (size === 'lg' ? 'lg' : 'md') : 'sm'}
                onClick={onCardClick ? () => onCardClick(player.id, index, card) : undefined}
                highlight={
                  selectedIndex === index ||
                  (reactionActive && (isMe || selectable)) ||
                  powerHL
                }
                disabled={!onCardClick || isPeekedCard}
              />
            );
          })}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className={`rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-gray-600 text-xs
            ${isMe ? 'w-[70px] h-[100px]' : 'w-[52px] h-[74px]'}`}>
            Empty
          </div>
        )}
      </div>
    </div>
  );
}
