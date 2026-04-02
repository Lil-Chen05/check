import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import GameBoard from '../components/GameBoard';
import PowerModal from '../components/PowerModal';
import ReactionOverlay from '../components/ReactionOverlay';
import ScoreBoard from '../components/ScoreBoard';

export default function GamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, profile, getToken, isConfigured } = useAuth();

  const [token, setToken] = useState(null);
  useEffect(() => {
    if (isConfigured) getToken().then(setToken);
  }, [getToken, isConfigured]);

  const userId = user?.id || sessionStorage.getItem('guestId') || 'guest';
  const displayName = profile?.display_name || sessionStorage.getItem('guestName') || 'Player';

  const { connected, emit, on } = useSocket(token || 'dev-token', userId, displayName);
  const {
    gameState,
    reactionWindow,
    lastReactionResult,
    reactionCardReveal,
    checkCallInfo,
    gameOver,
    lastCardPlayed,
  } = useGameState(null, on);

  const [peekedCard, setPeekedCard] = useState(null);

  useEffect(() => {
    if (!on) return;
    const unsub = on('returned-to-lobby', () => navigate(`/lobby/${roomCode}`));
    return unsub;
  }, [on, navigate, roomCode]);

  // Re-sync after navigation: `game-started` may have fired while Lobby was still mounted,
  // before this page registered `useGameState` listeners. `join-room` replays state for in-game rooms.
  useEffect(() => {
    if (!connected || !emit || !roomCode) return;
    emit('join-room', { roomCode }).then((res) => {
      if (res?.error) navigate('/home');
    });
  }, [connected, emit, roomCode, navigate]);

  const handlePeekCard = useCallback(async (cardIndex) => {
    const res = await emit('peek-card', { cardIndex });
    if (res?.card) {
      setPeekedCard({ ...res.card, cardIndex });
      setTimeout(() => setPeekedCard(null), 2000);
    }
  }, [emit]);

  const handleDrawCard = useCallback(async () => {
    await emit('draw-card');
  }, [emit]);

  const handlePlayDrawnCard = useCallback(async () => {
    await emit('play-drawn-card');
  }, [emit]);

  const handleSwapCard = useCallback(async (handIndex) => {
    await emit('swap-card', { handIndex });
  }, [emit]);

  const handleCallCheck = useCallback(async () => {
    await emit('call-check');
  }, [emit]);

  const handleReactOwnCard = useCallback(async (cardIndex) => {
    await emit('react-own-card', { cardIndex });
  }, [emit]);

  /** Opponent click: (null, targetPlayerId, targetCardIndex). Complete trade: (giveCardIndex). */
  const handleReactSteal = useCallback(
    async (a, targetPlayerId, targetCardIndex) => {
      if (gameState?.pendingStealGive?.isMyGive && typeof a === 'number') {
        await emit('react-steal', { giveCardIndex: a });
        return;
      }
      if (targetPlayerId !== undefined && targetCardIndex !== undefined) {
        await emit('react-steal', { targetPlayerId, targetCardIndex });
      }
    },
    [emit, gameState?.pendingStealGive],
  );

  const handleResolvePower = useCallback(async (data) => {
    const res = await emit('resolve-power', data);
    if (res?.peekedCard) {
      setPeekedCard(res.peekedCard);
      setTimeout(() => setPeekedCard(null), 2500);
    }
  }, [emit]);

  const handleReturnToLobby = useCallback(async () => {
    await emit('return-to-lobby');
    navigate(`/lobby/${roomCode}`);
  }, [emit, navigate, roomCode]);

  if (!gameState) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center">
        <div className="text-gold-400 text-xl animate-pulse">Loading game...</div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <ScoreBoard
        scores={gameOver.scores}
        myId={userId}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  const showPowerModal =
    gameState.phase === 'power-resolve' &&
    gameState.pendingPower?.isMyPower;

  return (
    <div className="h-screen felt-bg flex flex-col relative overflow-hidden">
      {/* Check call banner */}
      {checkCallInfo && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-red-600/90 text-white text-center py-2 text-sm font-bold animate-slide-up">
          {checkCallInfo.callerName} called CHECK! Final rounds!
        </div>
      )}

      <GameBoard
        gameState={gameState}
        reactionWindow={reactionWindow}
        onDrawCard={handleDrawCard}
        onPlayDrawnCard={handlePlayDrawnCard}
        onSwapCard={handleSwapCard}
        onPeekCard={handlePeekCard}
        onCallCheck={handleCallCheck}
        onReactOwnCard={handleReactOwnCard}
        onReactSteal={handleReactSteal}
        pendingStealGive={gameState.pendingStealGive}
      />

      <ReactionOverlay
        reactionWindow={reactionWindow}
        lastResult={lastReactionResult}
        cardReveal={reactionCardReveal}
      />

      {peekedCard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-2xl p-6 flex flex-col items-center gap-3 animate-slide-up pointer-events-none">
            <span className="text-gold-400 text-sm font-medium">Peeked Card</span>
            <div className="transform scale-150">
              <div className={`w-[70px] h-[100px] rounded-lg bg-white flex flex-col items-center justify-center shadow-card-hover ${
                peekedCard.suit === 'hearts' || peekedCard.suit === 'diamonds' ? 'text-red-600' :
                peekedCard.rank === 'Joker' ? 'text-purple-600' : 'text-gray-900'
              }`}>
                <span className="text-2xl font-bold">
                  {peekedCard.rank === 'Joker' ? '★' : peekedCard.rank}
                </span>
                {peekedCard.rank !== 'Joker' && (
                  <span className="text-lg">
                    {peekedCard.suit === 'hearts' ? '♥' : peekedCard.suit === 'diamonds' ? '♦' :
                     peekedCard.suit === 'clubs' ? '♣' : '♠'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPowerModal && (
        <PowerModal
          power={gameState.pendingPower}
          players={gameState.players}
          myId={userId}
          onResolve={handleResolvePower}
        />
      )}
    </div>
  );
}
