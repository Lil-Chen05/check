import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const PULSE_MS = 650;
const JACK_PEEK_PULSE_MS = 2600;
const SWAP_ANIM_MS = 3000;

function feedbackKey(fb) {
  if (!fb) return '';
  if (fb.kind === 'powerPairSwap') {
    return [
      fb.v,
      fb.kind,
      fb.roleA?.playerId ?? '',
      fb.roleA?.slotIndex ?? '',
      fb.roleB?.playerId ?? '',
      fb.roleB?.slotIndex ?? '',
    ].join('|');
  }
  if (fb.kind === 'drawHandSwap') {
    return [
      fb.v,
      fb.kind,
      fb.actorId ?? '',
      fb.slotIndex ?? '',
      fb.cardId ?? '',
      fb.incomingCardId ?? '',
    ].join('|');
  }
  return [fb.v, fb.kind, fb.actorId, fb.cardId ?? '', fb.slotIndex ?? ''].join('|');
}

/**
 * Derives short-lived UI cues from server `lastEventFeedback` without touching game rules.
 * Burst policy: newest event replaces any active pulse.
 */
export function useTableFeedback(gameState) {
  const prefersReducedMotion = useReducedMotion();
  const [activeFb, setActiveFb] = useState(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const stateRef = useRef(gameState);

  stateRef.current = gameState;

  const key = useMemo(
    () => feedbackKey(gameState?.lastEventFeedback ?? null),
    [gameState?.lastEventFeedback],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !key) {
      setActiveFb(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    setActiveFb(stateRef.current?.lastEventFeedback ?? null);

    if (timerRef.current) clearTimeout(timerRef.current);
    const fb = stateRef.current?.lastEventFeedback;
    const duration =
      fb?.kind === 'jackPeek'
        ? JACK_PEEK_PULSE_MS
        : fb?.kind === 'powerPairSwap' || fb?.kind === 'drawHandSwap'
          ? SWAP_ANIM_MS
          : PULSE_MS;
    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setActiveFb(null);
      timerRef.current = null;
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [key, prefersReducedMotion]);

  return useMemo(() => {
    const empty = {
      pileHighlightCardId: null,
      slotPulses: [],
      holdingHighlight: false,
      pairSwap: null,
      drawHandSwap: null,
    };

    if (!gameState || !activeFb) {
      return empty;
    }

    if (prefersReducedMotion) {
      return empty;
    }

    const myId = gameState.myId;
    let pileHighlightCardId = null;
    const slotPulses = [];
    let holdingHighlight = false;
    let pairSwap = null;
    let drawHandSwap = null;

    switch (activeFb.kind) {
      case 'drawn':
        holdingHighlight = activeFb.actorId === myId;
        break;
      case 'played':
      case 'takenFromPile':
        if (activeFb.cardId) pileHighlightCardId = activeFb.cardId;
        break;
      case 'drawHandSwap':
        if (activeFb.cardId) pileHighlightCardId = activeFb.cardId;
        if (
          activeFb.slotIndex != null &&
          activeFb.actorId &&
          typeof activeFb.slotIndex === 'number'
        ) {
          drawHandSwap = {
            playerId: activeFb.actorId,
            index: activeFb.slotIndex,
          };
        }
        break;
      case 'powerPairSwap':
        if (
          activeFb.roleA?.playerId != null &&
          activeFb.roleA?.slotIndex != null &&
          activeFb.roleB?.playerId != null &&
          activeFb.roleB?.slotIndex != null
        ) {
          pairSwap = {
            a: { playerId: activeFb.roleA.playerId, index: activeFb.roleA.slotIndex },
            b: { playerId: activeFb.roleB.playerId, index: activeFb.roleB.slotIndex },
          };
        }
        break;
      case 'jackPeek':
        if (activeFb.slotIndex != null && activeFb.actorId) {
          slotPulses.push({
            playerId: activeFb.actorId,
            index: activeFb.slotIndex,
            tone: 'emerald',
          });
        }
        break;
      default:
        break;
    }

    return {
      pileHighlightCardId,
      slotPulses,
      holdingHighlight,
      pairSwap,
      drawHandSwap,
    };
  }, [gameState, activeFb, prefersReducedMotion]);
}
