import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import PlayerHand from './PlayerHand';
import DrawPile from './DrawPile';
import PlayPile from './PlayPile';
import Card from './Card';
import { useCompactTableLayout } from '../hooks/useCompactTableLayout';

/** Keep in sync with server/game/Reactions.js MAX_HAND_FOR_STEAL_REACT */
const MAX_HAND_FOR_STEAL_REACT = 7;

export default function GameBoard({
  gameState,
  reactionWindow,
  checkCallInfo = null,
  onDrawCard,
  onTakeFromPile,
  onPlayDrawnCard,
  onSwapCard,
  onPeekCard,
  onCallCheck,
  onReactOwnCard,
  onReactSteal,
  onResolvePower,
  onStartQueuedPower,
  pendingStealGive,
  /** @type {{ pileHighlightCardId: string|null, slotPulses: Array<{playerId: string, index: number, tone?: string}>, holdingHighlight: boolean, pairSwap: object|null, drawHandSwap: object|null }} */
  tableFeedback = {
    pileHighlightCardId: null,
    slotPulses: [],
    holdingHighlight: false,
    pairSwap: null,
    drawHandSwap: null,
  },
}) {
  const reduceMotion = useReducedMotion();
  const compactTable = useCompactTableLayout();
  const handSize = compactTable ? 'xs' : 'sm';

  const {
    myId,
    phase,
    currentPlayerId,
    isMyTurn,
    drawnCard,
    drawDeckCount,
    playPileTop,
    playPileCount,
    players,
    checkCaller,
    pendingPower,
    canStartQueuedPower = false,
    queuedPowerControllerName = null,
    drawnFromPlayPile = false,
  } = gameState;

  const me = players.find(p => p.id === myId);
  const opponents = useMemo(() => players.filter(p => p.id !== myId), [players, myId]);

  const [reactArmed, setReactArmed] = useState(false);
  const [optimisticPowerSecond, setOptimisticPowerSecond] = useState(null);
  const [optimisticDrawSlot, setOptimisticDrawSlot] = useState(null);

  const reactionOpen = reactionWindow?.active || false;
  const effectiveReact = reactArmed && reactionOpen && !pendingStealGive;
  const reactStealAllowed =
    effectiveReact && me && me.cardCount < MAX_HAND_FOR_STEAL_REACT;

  const isPowerController = phase === 'power-resolve' && pendingPower?.isMyPower;
  const powerType = pendingPower?.type;
  const powerStep = pendingPower?.step;

  useEffect(() => {
    if (!reactionOpen) setReactArmed(false);
  }, [reactionOpen]);

  useEffect(() => {
    if (phase === 'power-resolve') setReactArmed(false);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'power-resolve') setOptimisticPowerSecond(null);
  }, [phase]);

  useEffect(() => {
    if (drawnCard == null) setOptimisticDrawSlot(null);
  }, [drawnCard]);

  useEffect(() => {
    if (!optimisticPowerSecond) return undefined;
    const t = setTimeout(() => setOptimisticPowerSecond(null), 2500);
    return () => clearTimeout(t);
  }, [optimisticPowerSecond]);

  useEffect(() => {
    if (optimisticDrawSlot == null) return undefined;
    const t = setTimeout(() => setOptimisticDrawSlot(null), 2500);
    return () => clearTimeout(t);
  }, [optimisticDrawSlot]);

  const canDraw = isMyTurn && phase === 'turn-draw';
  const canTakeFromPile =
    canDraw && playPileCount >= 1 && me && me.cardCount >= 1;
  const canPlay = isMyTurn && phase === 'turn-action' && drawnCard;
  const canPlayDrawnToPile = canPlay && !drawnFromPlayPile;
  const canPeek = phase === 'setup-peek' && me && !me.hasPeeked;
  const canCheck =
    isMyTurn && phase === 'turn-draw' && !checkCaller && !queuedPowerControllerName;

  const redKingPicking = isPowerController && powerType === 'red-king';

  const queenAnchor =
    pendingPower?.type === 'queen' ? pendingPower.queenAnchor ?? null : null;

  const handleQueenFieldClick = useCallback(
    (playerId, cardIndex) => {
      const pos = { playerId, cardIndex };
      if (!queenAnchor) {
        onResolvePower({ pos1: pos });
        return;
      }
      if (
        queenAnchor.playerId === playerId &&
        queenAnchor.cardIndex === cardIndex
      ) {
        onResolvePower({ pos1: pos });
        return;
      }
      setOptimisticPowerSecond({ playerId, index: cardIndex });
      onResolvePower({ pos2: pos });
    },
    [queenAnchor, onResolvePower],
  );

  const handleBlackKingPeekClick = useCallback((playerId, cardIndex) => {
    onResolvePower({ targetPlayerId: playerId, cardIndex });
  }, [onResolvePower]);

  const handleBlackKingSwapClick = useCallback((playerId, cardIndex) => {
    setOptimisticPowerSecond({ playerId, index: cardIndex });
    onResolvePower({ toPos: { playerId, cardIndex } });
  }, [onResolvePower]);

  const handleMyCardClick = (playerId, cardIndex) => {
    if (canPeek) {
      onPeekCard(cardIndex);
      return;
    }
    if (pendingStealGive?.isMyGive) {
      onReactSteal(cardIndex);
      return;
    }
    if (isPowerController) {
      if (powerType === 'jack') {
        onResolvePower({ cardIndex });
        return;
      }
      if (powerType === 'queen') {
        handleQueenFieldClick(playerId, cardIndex);
        return;
      }
      if (powerType === 'black-king' && powerStep === 'peek') {
        handleBlackKingPeekClick(playerId, cardIndex);
        return;
      }
      if (powerType === 'black-king' && powerStep === 'swap') {
        handleBlackKingSwapClick(playerId, cardIndex);
        return;
      }
    }
    if (canPlay) {
      setOptimisticDrawSlot(cardIndex);
      onSwapCard(cardIndex);
      return;
    }
    if (effectiveReact) {
      onReactOwnCard(cardIndex);
      setReactArmed(false);
    }
  };

  const handleOpponentCardClick = (playerId, cardIndex) => {
    if (isPowerController) {
      if (powerType === 'queen') {
        handleQueenFieldClick(playerId, cardIndex);
        return;
      }
      if (powerType === 'black-king' && powerStep === 'peek') {
        handleBlackKingPeekClick(playerId, cardIndex);
        return;
      }
      if (powerType === 'black-king' && powerStep === 'swap') {
        handleBlackKingSwapClick(playerId, cardIndex);
        return;
      }
    }
    if (reactStealAllowed) {
      onReactSteal(null, playerId, cardIndex);
      setReactArmed(false);
    }
  };

  const myCardHandler =
    redKingPicking || (isPowerController && powerType === 'red-king')
      ? undefined
      : handleMyCardClick;

  const oppCardHandler =
    redKingPicking || !isPowerController
      ? reactStealAllowed
        ? handleOpponentCardClick
        : undefined
      : (powerType === 'queen' || powerType === 'black-king')
        ? handleOpponentCardClick
        : undefined;

  const phaseLabel = getPhaseLabel({
    phase,
    isMyTurn,
    canPeek,
    checkCaller,
    drawnCard,
    pendingStealGive,
    myId,
    reactionOpen,
    reactArmed,
    isPowerController,
    pendingPower,
    canStartQueuedPower,
    queuedPowerControllerName,
    drawnFromPlayPile,
  });

  const blackPeeked =
    powerType === 'black-king' && powerStep === 'swap' && pendingPower?.peekedPosition
      ? pendingPower.peekedPosition
      : null;

  const blueSelectionSlots = useMemo(() => {
    const out = [];
    if (pendingPower?.type === 'queen' && pendingPower.queenAnchor) {
      out.push({
        playerId: pendingPower.queenAnchor.playerId,
        index: pendingPower.queenAnchor.cardIndex,
      });
    }
    if (
      pendingPower?.type === 'black-king' &&
      pendingPower.step === 'swap' &&
      pendingPower.peekedPosition
    ) {
      out.push({
        playerId: pendingPower.peekedPosition.playerId,
        index: pendingPower.peekedPosition.cardIndex,
      });
    }
    return out;
  }, [pendingPower]);

  const checkNoticeText =
    checkCaller &&
    (checkCallInfo?.callerName
      ? `${checkCallInfo.callerName} called Check — final rounds`
      : 'Check called — final rounds');

  const showReactionControls = !pendingStealGive && reactionOpen;
  /** Play vs Check share one column (mutually exclusive in rules). */
  const showSharedPlayCheckSlot = canCheck || (drawnCard && canPlay);
  const showActionColumn = showReactionControls || showSharedPlayCheckSlot;

  return (
    <div className="flex flex-col h-full min-h-0 min-w-0">
      {/* Opponents — scrollable so field + hand stay reachable on mobile */}
      <div
        className="flex-1 min-h-0 min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 sm:px-4 pt-3 pb-2 [scrollbar-gutter:stable]"
      >
        <div className="flex flex-col items-center gap-4 sm:gap-5 w-full max-w-full min-w-0">
          {opponents.map(p => (
            <PlayerHand
              key={p.id}
              player={p}
              isMe={false}
              isActive={p.id === currentPlayerId}
              onCardClick={oppCardHandler}
              reactionActive={reactStealAllowed}
              selectable={reactStealAllowed && !pendingStealGive}
              redKingBannerPick={redKingPicking}
              onRedKingSelect={redKingPicking ? (id) => onResolvePower({ targetPlayerId: id }) : undefined}
              emeraldPowerSlots={[]}
              blueSelectSlots={blueSelectionSlots}
              blackKingPeekedSlot={blackPeeked}
              slotPulses={tableFeedback.slotPulses}
              pairSwap={tableFeedback.pairSwap}
              drawHandSwap={tableFeedback.drawHandSwap}
              optimisticPowerSecond={optimisticPowerSecond}
              optimisticDrawHandIndex={null}
              size={handSize}
            />
          ))}
        </div>
      </div>

      {/* Piles + holding + 2x2 actions; vertical-only scroll elsewhere */}
      <div className="flex-shrink-0 border-t border-white/5 bg-black/10 w-full max-w-full min-w-0 overflow-x-hidden">
        <div className="flex flex-col items-stretch gap-2 px-2 sm:px-4 py-2 w-full min-w-0 max-w-full">
          {checkNoticeText && (
            <p
              className="text-[11px] sm:text-xs px-2.5 py-1.5 rounded-lg text-center w-full max-w-md mx-auto
                         border border-rose-500/25 bg-rose-950/35 text-rose-100/90 leading-snug"
              role="status"
            >
              {checkNoticeText}
            </p>
          )}

          <div className="flex flex-row items-end justify-center gap-2 sm:gap-3 w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-0.5">
            <div className="flex flex-row flex-nowrap items-end justify-center gap-2 sm:gap-3 shrink-0">
              <DrawPile
                count={drawDeckCount}
                onClick={onDrawCard}
                disabled={!canDraw}
                canDraw={canDraw}
              />

              <PlayPile
                topCard={playPileTop}
                reactionHint={reactionOpen}
                reactionArmed={effectiveReact}
                count={playPileCount}
                canTakeFromPile={canTakeFromPile}
                onTakeFromPile={canTakeFromPile ? () => onTakeFromPile?.() : undefined}
                highlightCardId={tableFeedback.pileHighlightCardId}
                reduceMotion={reduceMotion}
              />

              <AnimatePresence>
                {drawnCard && canPlay && (
                  <motion.div
                    initial={reduceMotion ? false : { x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={reduceMotion ? undefined : { x: 50, opacity: 0 }}
                    className={`flex flex-col items-center gap-2 rounded-xl px-1 ${
                      !(drawnCard && canPlay) && tableFeedback.holdingHighlight
                        ? 'ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-black/30'
                        : ''
                    }`}
                  >
                    <Card
                      card={drawnCard}
                      faceUp
                      size={compactTable ? 'sm' : 'md'}
                      drawHoldingAccent={!!drawnCard && canPlay}
                      highlight={!(drawnCard && canPlay)}
                      motionPreset="interactive"
                      enableLayout={false}
                    />
                    <span className="text-xs text-gray-400">Holding</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {showActionColumn && (
              <div className="flex flex-col gap-1.5 shrink-0 w-[5.25rem] self-center">
                {showReactionControls && (
                  <>
                    <div className="min-h-[44px] flex">
                      {reactArmed ? (
                        <button
                          type="button"
                          onClick={() => setReactArmed(false)}
                          title="Cancel react"
                          aria-label="Cancel react"
                          className="min-h-[44px] w-full py-2 px-2 rounded-lg text-xs font-bold bg-gray-700/80 text-gray-200 border border-gray-500/40 hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReactArmed(true)}
                          title="Arm react to match the pile"
                          aria-label="React to the play pile"
                          className="min-h-[44px] w-full py-2 px-2 rounded-lg text-xs font-bold bg-amber-600/90 text-black border border-amber-400/50 hover:bg-amber-500 shadow-glow"
                        >
                          React
                        </button>
                      )}
                    </div>
                    <div className="min-h-[44px] flex">
                      <button
                        type="button"
                        onClick={() => onStartQueuedPower?.()}
                        disabled={!canStartQueuedPower}
                        title="Resolve queued pile power"
                        aria-label="Resolve queued pile power"
                        className={`min-h-[44px] w-full py-2 px-2 rounded-lg text-xs font-bold border ${
                          canStartQueuedPower
                            ? 'bg-emerald-700/90 text-white border-emerald-500/50 hover:bg-emerald-600'
                            : 'bg-gray-800/50 text-gray-500 border-gray-600/30 cursor-not-allowed'
                        }`}
                      >
                        Resolve
                      </button>
                    </div>
                  </>
                )}
                {showSharedPlayCheckSlot && (
                  <div className="flex items-center justify-center min-h-[44px]">
                    {canPlayDrawnToPile ? (
                      <button
                        type="button"
                        onClick={onPlayDrawnCard}
                        title="Play card to pile"
                        aria-label="Play card to pile"
                        className="min-h-[44px] w-full py-2 px-2 rounded-lg text-xs font-bold btn-primary"
                      >
                        Play
                      </button>
                    ) : canCheck ? (
                      <button
                        type="button"
                        onClick={onCallCheck}
                        title="Call Check"
                        aria-label="Call Check"
                        className="min-h-[44px] w-full py-2 px-2 rounded-lg text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white border border-red-400/30"
                      >
                        Check
                      </button>
                    ) : (
                      <div className="w-full min-h-[44px]" aria-hidden />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex-shrink-0 text-center py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseLabel}
            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            className="text-sm text-emerald-300/80 font-medium px-2"
          >
            {phaseLabel}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* My hand */}
      <div
        className="flex-shrink-0 pt-1 px-3 sm:px-4 flex justify-center
          pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {me && (
          <PlayerHand
            player={me}
            isMe
            isActive={me.id === currentPlayerId}
            onCardClick={myCardHandler}
            reactionActive={effectiveReact || !!pendingStealGive?.isMyGive}
            selectable={!!pendingStealGive?.isMyGive}
            selectedIndex={-1}
            redKingBannerPick={redKingPicking}
            onRedKingSelect={redKingPicking ? (id) => onResolvePower({ targetPlayerId: id }) : undefined}
            emeraldPowerSlots={[]}
            blueSelectSlots={blueSelectionSlots}
            blackKingPeekedSlot={blackPeeked}
            slotPulses={tableFeedback.slotPulses}
            pairSwap={tableFeedback.pairSwap}
            drawHandSwap={tableFeedback.drawHandSwap}
            optimisticPowerSecond={optimisticPowerSecond}
            optimisticDrawHandIndex={optimisticDrawSlot}
            size={handSize}
          />
        )}
      </div>
    </div>
  );
}

function getPhaseLabel({
  phase,
  isMyTurn,
  canPeek,
  checkCaller,
  drawnCard,
  pendingStealGive,
  reactionOpen,
  reactArmed,
  isPowerController,
  pendingPower,
  canStartQueuedPower,
  queuedPowerControllerName,
  drawnFromPlayPile,
}) {
  if (phase === 'steal-give' && pendingStealGive?.isMyGive) {
    return `You called it right — tap one of YOUR cards to give to ${pendingStealGive.victimName || 'opponent'}`;
  }
  if (phase === 'steal-give') return 'Waiting for the stealer to complete the trade…';

  if (isPowerController && pendingPower) {
    switch (pendingPower.type) {
      case 'jack':
        return 'Jack — tap one of your face-down cards to peek';
      case 'queen': {
        const anchor = pendingPower?.queenAnchor;
        return anchor
          ? 'Queen — tap a second card anywhere to swap with the first'
          : 'Queen — tap any face-down card as the first swap';
      }
      case 'red-king':
        return 'Red King — tap a player name to give them a new card';
      case 'black-king':
        return pendingPower.step === 'peek'
          ? 'Black King — tap any face-down card to peek'
          : 'Black King — tap where to move the peeked card';
      default:
        return 'Resolve your power…';
    }
  }

  if (queuedPowerControllerName && phase !== 'power-resolve') {
    if (canStartQueuedPower) {
      return 'Optional: arm React, or Resolve to start your pile power';
    }
    return `Waiting for ${queuedPowerControllerName} to resolve the power on the pile…`;
  }

  if (reactionOpen && reactArmed) {
    return 'Reacting — tap your card or an opponent’s to match / blind-call';
  }
  if (reactionOpen) {
    return 'Optional: tap React to try the pile';
  }

  if (canPeek) return 'Peek at one of your cards (tap to peek)';
  if (phase === 'setup-peek') return 'Waiting for all players to peek...';
  if (phase === 'turn-draw' && isMyTurn) {
    return 'Your turn — draw from the deck, take the pile top, or use Call Check';
  }
  if (phase === 'turn-draw') return 'Waiting for active player to draw...';
  if (phase === 'turn-action' && isMyTurn && drawnCard && drawnFromPlayPile) {
    return 'Swap the taken card with one of your hand cards';
  }
  if (phase === 'turn-action' && isMyTurn && drawnCard) return 'Play to pile or tap a card to swap';
  if (phase === 'turn-action') return 'Waiting for active player...';
  if (phase === 'power-resolve') return 'Resolving power card...';
  if (phase === 'game-over') return 'Game Over!';
  if (checkCaller) return 'Final rounds';
  return '';
}
