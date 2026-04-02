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
}) {
  const cards = player.hand || [];

  return (
    <div className={`flex flex-col items-center gap-2 ${isActive ? '' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
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
      </div>

      <div className={`flex gap-1.5 ${isMe ? 'gap-2' : 'gap-1'}`}>
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              faceUp={false}
              size={isMe ? (size === 'lg' ? 'lg' : 'md') : 'sm'}
              onClick={onCardClick ? () => onCardClick(player.id, index, card) : undefined}
              highlight={
                selectedIndex === index ||
                (reactionActive && (isMe || selectable))
              }
              disabled={!onCardClick}
            />
          ))}
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
