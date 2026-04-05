import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import GameBoard from '../components/GameBoard';
import ReactionOverlay from '../components/ReactionOverlay';
import ScoreBoard from '../components/ScoreBoard';
import { useTableFeedback } from '../hooks/useTableFeedback';
import { useEventLog } from '../hooks/useEventLog';

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

  const tableFeedback = useTableFeedback(gameState);
  const logEntries = useEventLog(gameState, lastReactionResult);

  const [peekedCard, setPeekedCard] = useState(null);
  const peekedCardTimerRef = useRef(null);
  const [actionError, setActionError] = useState('');

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
      if (peekedCardTimerRef.current) clearTimeout(peekedCardTimerRef.current);
      setPeekedCard({ ...res.card, cardIndex });
      peekedCardTimerRef.current = setTimeout(() => setPeekedCard(null), 2000);
    }
  }, [emit]);

  const handleDrawCard = useCallback(async () => {
    await emit('draw-card');
  }, [emit]);

  const handleTakeFromPile = useCallback(async () => {
    const res = await emit('take-play-pile-top');
    if (res?.error) {
      setActionError(res.error);
      setTimeout(() => setActionError(''), 5000);
    } else {
      setActionError('');
    }
  }, [emit]);

  const handlePlayDrawnCard = useCallback(async () => {
    const res = await emit('play-drawn-card');
    if (res?.error) {
      setActionError(res.error);
      setTimeout(() => setActionError(''), 5000);
    } else {
      setActionError('');
    }
  }, [emit]);

  const handleSwapCard = useCallback(async (handIndex) => {
    const res = await emit('swap-card', { handIndex });
    if (res?.error) {
      setActionError(res.error);
      setTimeout(() => setActionError(''), 5000);
    } else {
      setActionError('');
    }
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
      if (peekedCardTimerRef.current) clearTimeout(peekedCardTimerRef.current);
      setPeekedCard(res.peekedCard);
      peekedCardTimerRef.current = setTimeout(() => setPeekedCard(null), 2500);
    }
  }, [emit]);

  const handleStartQueuedPower = useCallback(async () => {
    const res = await emit('start-queued-power');
    if (res?.error) {
      setActionError(res.error);
      setTimeout(() => setActionError(''), 5000);
    } else {
      setActionError('');
    }
  }, [emit]);

  const handleReturnToLobby = useCallback(async () => {
    await emit('return-to-lobby');
    navigate(`/lobby/${roomCode}`);
  }, [emit, navigate, roomCode]);

  if (!gameState) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center">
        <div className="text-antique-gold-400 text-xl animate-pulse font-display tracking-display">Loading game...</div>
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

  return (
    <div className="h-screen felt-bg flex flex-col relative overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />
      {actionError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md px-4 py-2 rounded-lg bg-midnight-800/95 backdrop-blur-sm border border-antique-gold-700/40 text-antique-gold-300 text-sm text-center shadow-panel">
          {actionError}
        </div>
      )}

      <GameBoard
        gameState={gameState}
        reactionWindow={reactionWindow}
        checkCallInfo={checkCallInfo}
        tableFeedback={tableFeedback}
        onDrawCard={handleDrawCard}
        onTakeFromPile={handleTakeFromPile}
        onPlayDrawnCard={handlePlayDrawnCard}
        onSwapCard={handleSwapCard}
        onPeekCard={handlePeekCard}
        onCallCheck={handleCallCheck}
        onReactOwnCard={handleReactOwnCard}
        onReactSteal={handleReactSteal}
        onResolvePower={handleResolvePower}
        onStartQueuedPower={handleStartQueuedPower}
        pendingStealGive={gameState.pendingStealGive}
        logEntries={logEntries}
      />

      <ReactionOverlay
        reactionWindow={reactionWindow}
        lastResult={lastReactionResult}
        cardReveal={reactionCardReveal}
      />

      {peekedCard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-midnight-950/90 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center gap-3 animate-slide-up pointer-events-none border border-antique-gold-600/20 shadow-panel">
            <span className="text-antique-gold-400 text-xs font-medium uppercase tracking-widest">Peeked Card</span>
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

    </div>
  );
}
