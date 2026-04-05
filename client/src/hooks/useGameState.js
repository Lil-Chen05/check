import { useState, useEffect, useCallback, useRef } from 'react';

const REACTION_REVEAL_MS = 3000;

export function useGameState(socket, on) {
  const [gameState, setGameState] = useState(null);
  const [reactionWindow, setReactionWindow] = useState(null);
  const [lastReactionResult, setLastReactionResult] = useState(null);
  const [reactionCardReveal, setReactionCardReveal] = useState(null);
  const revealClearRef = useRef(null);
  const [checkCallInfo, setCheckCallInfo] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [lastCardPlayed, setLastCardPlayed] = useState(null);
  const [exposedSlot, setExposedSlot] = useState(null);
  const exposedSlotTimerRef = useRef(null);

  useEffect(() => {
    if (!on) return;

    const unsubs = [
      on('game-started', (state) => {
        setGameState(state);
        setGameOver(null);
        setCheckCallInfo(null);
      }),

      on('game-state', (state) => {
        setGameState(state);
      }),

      on('reaction-window-open', (data) => {
        setReactionWindow({
          active: true,
          cardOnPile: data.cardOnPile,
          duration: data.duration == null ? null : data.duration,
          startTime: Date.now(),
        });
      }),

      on('reaction-window-closed', () => {
        setReactionWindow(null);
      }),

      on('reaction-result', (result) => {
        setLastReactionResult(result);
        setTimeout(() => setLastReactionResult(null), REACTION_REVEAL_MS);

        if (result.exposedSlot) {
          if (exposedSlotTimerRef.current) clearTimeout(exposedSlotTimerRef.current);
          setExposedSlot(result.exposedSlot);
          exposedSlotTimerRef.current = setTimeout(() => {
            setExposedSlot(null);
            exposedSlotTimerRef.current = null;
          }, REACTION_REVEAL_MS);
        }

        const cards = result.revealCards?.filter((c) => c?.rank != null) ?? [];
        if (cards.length > 0) {
          if (revealClearRef.current) clearTimeout(revealClearRef.current);
          setReactionCardReveal({ cards });
          revealClearRef.current = setTimeout(() => {
            setReactionCardReveal(null);
            revealClearRef.current = null;
          }, REACTION_REVEAL_MS);
        }
      }),

      on('check-called', (info) => {
        setCheckCallInfo(info);
      }),

      on('card-played', (data) => {
        setLastCardPlayed(data);
        setTimeout(() => setLastCardPlayed(null), 1500);
      }),

      on('game-over', (data) => {
        setGameOver(data);
        setReactionWindow(null);
        if (revealClearRef.current) clearTimeout(revealClearRef.current);
        revealClearRef.current = null;
        setReactionCardReveal(null);
        if (exposedSlotTimerRef.current) clearTimeout(exposedSlotTimerRef.current);
        exposedSlotTimerRef.current = null;
        setExposedSlot(null);
      }),

      on('returned-to-lobby', () => {
        if (revealClearRef.current) clearTimeout(revealClearRef.current);
        revealClearRef.current = null;
        setReactionCardReveal(null);
        if (exposedSlotTimerRef.current) clearTimeout(exposedSlotTimerRef.current);
        exposedSlotTimerRef.current = null;
        setExposedSlot(null);
        setGameState(null);
        setGameOver(null);
        setReactionWindow(null);
        setCheckCallInfo(null);
      }),
    ];

    return () => {
      if (revealClearRef.current) {
        clearTimeout(revealClearRef.current);
        revealClearRef.current = null;
      }
      if (exposedSlotTimerRef.current) {
        clearTimeout(exposedSlotTimerRef.current);
        exposedSlotTimerRef.current = null;
      }
      unsubs.forEach((unsub) => unsub?.());
    };
  }, [on]);

  const reset = useCallback(() => {
    if (revealClearRef.current) clearTimeout(revealClearRef.current);
    revealClearRef.current = null;
    setReactionCardReveal(null);
    if (exposedSlotTimerRef.current) clearTimeout(exposedSlotTimerRef.current);
    exposedSlotTimerRef.current = null;
    setExposedSlot(null);
    setGameState(null);
    setReactionWindow(null);
    setLastReactionResult(null);
    setCheckCallInfo(null);
    setGameOver(null);
    setLastCardPlayed(null);
  }, []);

  return {
    gameState,
    reactionWindow,
    lastReactionResult,
    reactionCardReveal,
    checkCallInfo,
    gameOver,
    lastCardPlayed,
    exposedSlot,
    reset,
  };
}
