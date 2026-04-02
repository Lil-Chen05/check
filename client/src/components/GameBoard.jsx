import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerHand from './PlayerHand';
import DrawPile from './DrawPile';
import PlayPile from './PlayPile';
import Card from './Card';

export default function GameBoard({
  gameState,
  reactionWindow,
  onDrawCard,
  onPlayDrawnCard,
  onSwapCard,
  onPeekCard,
  onCallCheck,
  onReactOwnCard,
  onReactSteal,
  pendingStealGive,
}) {
  const { myId, phase, currentPlayerId, isMyTurn, drawnCard, drawDeckCount, playPileTop, playPileCount, players, checkCaller } = gameState;

  const me = players.find(p => p.id === myId);
  const opponents = useMemo(() => players.filter(p => p.id !== myId), [players, myId]);
  const isReactionActive = reactionWindow?.active || false;

  const canDraw = isMyTurn && phase === 'turn-draw';
  const canPlay = isMyTurn && phase === 'turn-action' && drawnCard;
  const canPeek = phase === 'setup-peek' && me && !me.hasPeeked;
  const canCheck = isMyTurn && phase === 'turn-draw' && !checkCaller;

  const handleMyCardClick = (playerId, cardIndex, card) => {
    if (canPeek) {
      onPeekCard(cardIndex);
      return;
    }
    if (pendingStealGive?.isMyGive) {
      onReactSteal(cardIndex);
      return;
    }
    if (canPlay) {
      onSwapCard(cardIndex);
      return;
    }
    if (isReactionActive) {
      onReactOwnCard(cardIndex);
      return;
    }
  };

  const handleOpponentCardClick = (playerId, cardIndex, card) => {
    if (isReactionActive) {
      onReactSteal(null, playerId, cardIndex);
      return;
    }
  };

  const phaseLabel = getPhaseLabel(phase, isMyTurn, canPeek, checkCaller, drawnCard, pendingStealGive, myId);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Opponents */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex flex-wrap justify-center gap-6">
          {opponents.map(p => (
            <PlayerHand
              key={p.id}
              player={p}
              isMe={false}
              isActive={p.id === currentPlayerId}
              onCardClick={isReactionActive ? handleOpponentCardClick : undefined}
              reactionActive={isReactionActive}
              selectable={isReactionActive && !pendingStealGive}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Center — Draw pile, play pile, drawn card */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4 min-h-0">
        <DrawPile
          count={drawDeckCount}
          onClick={onDrawCard}
          disabled={!canDraw}
          canDraw={canDraw}
        />

        <PlayPile
          topCard={playPileTop}
          reactionActive={isReactionActive}
          count={playPileCount}
        />

        <AnimatePresence>
          {drawnCard && canPlay && (
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs text-gray-400">Drawn</span>
              <Card card={drawnCard} faceUp size="md" highlight />
              <button onClick={onPlayDrawnCard} className="btn-primary text-xs px-3 py-1.5 mt-1">
                Play to Pile
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase indicator & Check button */}
      <div className="flex-shrink-0 text-center py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseLabel}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-emerald-300/80 font-medium"
          >
            {phaseLabel}
          </motion.div>
        </AnimatePresence>

        {canCheck && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={onCallCheck}
            className="mt-2 px-6 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold
                       rounded-lg shadow-lg transition-all text-sm border border-red-400/30"
          >
            Call Check!
          </motion.button>
        )}
      </div>

      {/* My hand */}
      <div className="flex-shrink-0 pb-4 pt-2 px-4 flex justify-center">
        {me && (
          <PlayerHand
            player={me}
            isMe
            isActive={me.id === currentPlayerId}
            onCardClick={handleMyCardClick}
            reactionActive={isReactionActive || !!pendingStealGive?.isMyGive}
            selectable={!!pendingStealGive?.isMyGive}
            selectedIndex={-1}
            size="lg"
          />
        )}
      </div>
    </div>
  );
}

function getPhaseLabel(phase, isMyTurn, canPeek, checkCaller, drawnCard, pendingStealGive, myId) {
  if (phase === 'steal-give' && pendingStealGive?.isMyGive) {
    return `You called it right — tap one of YOUR cards to give to ${pendingStealGive.victimName || 'opponent'}`;
  }
  if (phase === 'steal-give') return 'Waiting for the stealer to complete the trade…';
  if (canPeek) return 'Peek at one of your cards (tap to peek)';
  if (phase === 'setup-peek') return 'Waiting for all players to peek...';
  if (phase === 'turn-draw' && isMyTurn) return 'Your turn — draw a card from the deck';
  if (phase === 'turn-draw') return 'Waiting for active player to draw...';
  if (phase === 'turn-action' && isMyTurn && drawnCard) return 'Play to pile or tap a card to swap';
  if (phase === 'turn-action') return 'Waiting for active player...';
  if (phase === 'power-resolve') return 'Resolving power card...';
  if (phase === 'reaction-window') return 'React! Tap a card to match the pile';
  if (phase === 'game-over') return 'Game Over!';
  if (checkCaller) return 'Check has been called — final rounds!';
  return '';
}
