import { useCallback, useEffect, useRef, useState } from 'react';

const ENTRY_TTL_MS = 5000;
const MAX_ENTRIES = 4;

/** Stable key for a lastEventFeedback object — same shape as useTableFeedback's feedbackKey */
function feedbackKey(fb) {
  if (!fb) return '';
  return [
    fb.v,
    fb.kind,
    fb.actorId ?? '',
    fb.cardId ?? '',
    fb.slotIndex ?? '',
    fb.roleA?.playerId ?? '',
    fb.roleA?.slotIndex ?? '',
    fb.roleB?.playerId ?? '',
    fb.roleB?.slotIndex ?? '',
  ].join('|');
}

/**
 * Accumulates a short human-readable log from server feedback events and reaction results.
 * Returns an array of { id, text } entries, newest first, each expiring after ENTRY_TTL_MS.
 */
export function useEventLog(gameState, lastReactionResult) {
  const [entries, setEntries] = useState([]);
  const timersRef = useRef([]);
  const lastFbKeyRef = useRef('');
  const lastReactionRef = useRef(null);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const push = useCallback((text) => {
    const id = `${Date.now()}-${Math.random()}`;
    setEntries(prev => [{ id, text }, ...prev].slice(0, MAX_ENTRIES));
    const t = setTimeout(
      () => setEntries(prev => prev.filter(e => e.id !== id)),
      ENTRY_TTL_MS,
    );
    timersRef.current.push(t);
  }, []);

  // Game-state events
  useEffect(() => {
    const fb = gameState?.lastEventFeedback;
    const key = feedbackKey(fb);
    if (!key || key === lastFbKeyRef.current) return;
    lastFbKeyRef.current = key;

    const players = gameState?.players ?? [];
    const myId = gameState?.myId;
    const name = (id) => {
      if (!id) return 'Someone';
      if (id === myId) return 'You';
      return players.find(p => p.id === id)?.displayName || 'A player';
    };

    let text = '';
    switch (fb.kind) {
      case 'drawn':
        text = `${name(fb.actorId)} drew`;
        break;
      case 'played':
        text = `${name(fb.actorId)} played to pile`;
        break;
      case 'takenFromPile':
        text = `${name(fb.actorId)} took pile top`;
        break;
      case 'drawHandSwap':
        text = `${name(fb.actorId)} swapped slot ${(fb.slotIndex ?? 0) + 1}`;
        break;
      case 'jackPeek':
        text = `${name(fb.actorId)} peeked at a card`;
        break;
      case 'powerPairSwap': {
        const aId = fb.roleA?.playerId;
        const bId = fb.roleB?.playerId;
        if (aId && bId && aId !== bId) {
          text = `${name(aId)} & ${name(bId)} swapped`;
        } else if (aId) {
          text = `${name(aId)}: two cards swapped`;
        }
        break;
      }
      default:
        break;
    }
    if (text) push(text);
  }, [gameState?.lastEventFeedback, gameState?.players, gameState?.myId, push]);

  // Reaction results
  useEffect(() => {
    if (!lastReactionResult || lastReactionResult === lastReactionRef.current) return;
    lastReactionRef.current = lastReactionResult;

    const actor = lastReactionResult.reactorName || 'Someone';
    const victim = lastReactionResult.victimName;
    let text = '';

    if (lastReactionResult.needStealGive) {
      text = `${actor} stole — giving a card to ${victim || 'victim'}`;
    } else if (lastReactionResult.stealGiveCompleted) {
      text = `${actor} steal complete`;
    } else if (lastReactionResult.correct && !lastReactionResult.penalty) {
      text = `${actor} reacted — matched!`;
    } else if (lastReactionResult.penalty) {
      const reason = lastReactionResult.reason;
      text = reason?.includes('slow')
        ? `${actor} — too slow (penalty)`
        : `${actor} — wrong card (penalty)`;
    }
    if (text) push(text);
  }, [lastReactionResult, push]);

  return entries;
}
