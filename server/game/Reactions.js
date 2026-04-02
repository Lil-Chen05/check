import { getEffectiveRank, isPowerCard, getPowerType } from './Deck.js';

const REACTION_WINDOW_MS = 2500;

/** Full rank/suit for everyone to see during reaction reveal (3s on client). */
export function publicCard(card) {
  if (!card) return null;
  return { id: card.id, rank: card.rank, suit: card.suit };
}

export function openWindow(gameState, cardOnPile, playedBy, isFromReaction = false) {
  if (isFromReaction) return;

  gameState.reactionWindow = {
    active: true,
    cardOnPile,
    playedBy,
    attemptedPlayers: new Set(),
    firstSuccessful: null,
    timer: null,
    windowStart: Date.now(),
  };

  return REACTION_WINDOW_MS;
}

export function handleOwnCardReaction(gameState, reactorId, cardIndex) {
  const rw = gameState.reactionWindow;
  if (!rw.active) return { error: 'No active reaction window' };
  if (rw.attemptedPlayers.has(reactorId)) return { error: 'Already attempted this window' };

  const reactor = gameState.getPlayer(reactorId);
  if (!reactor) return { error: 'Player not found' };
  if (reactor.hand.length === 0) return { error: 'No cards to react with' };
  if (cardIndex < 0 || cardIndex >= reactor.hand.length) return { error: 'Invalid card index' };

  rw.attemptedPlayers.add(reactorId);
  const card = reactor.hand[cardIndex];
  const pileRank = getEffectiveRank(rw.cardOnPile);
  const cardRank = getEffectiveRank(card);
  const isMatch = pileRank === cardRank;

  if (isMatch && rw.firstSuccessful === null) {
    rw.firstSuccessful = reactorId;
    reactor.hand.splice(cardIndex, 1);
    reactor.knownCardIds.delete(card.id);
    gameState.playPile.push(card);

    const power = isPowerCard(card) ? getPowerType(card) : null;
    return {
      success: true,
      correct: true,
      reactorId,
      card,
      power,
      penalty: false,
      revealCards: [{ ...publicCard(card), role: 'reacted' }],
    };
  }

  gameState.ensureDrawDeck();
  const penaltyCard = gameState.drawDeck.length > 0 ? gameState.drawDeck.pop() : null;
  if (penaltyCard) {
    reactor.hand.push(penaltyCard);
  }

  return {
    success: true,
    correct: isMatch,
    reactorId,
    penalty: true,
    penaltyCard: penaltyCard ? { id: penaltyCard.id } : null,
    reason: isMatch ? 'Too slow — someone reacted first' : 'Wrong card',
    revealCards: [{ ...publicCard(card), role: 'reacted' }],
  };
}

/**
 * Phase 2: matched blind steal — reactor gives victim any one of their cards.
 * Power (if any) is queued only after the trade completes.
 */
export function completeStealGive(gameState, reactorId, giveCardIndex) {
  const pending = gameState.stealGivePending;
  if (!pending || pending.reactorId !== reactorId) {
    return { error: 'No pending steal trade' };
  }

  const reactor = gameState.getPlayer(reactorId);
  const victim = gameState.getPlayer(pending.victimId);
  if (!reactor || !victim) return { error: 'Player not found' };
  if (giveCardIndex < 0 || giveCardIndex >= reactor.hand.length) {
    return { error: 'Invalid card index' };
  }

  const giveCard = reactor.hand[giveCardIndex];
  reactor.hand.splice(giveCardIndex, 1);
  reactor.knownCardIds.delete(giveCard.id);
  victim.hand.push(giveCard);

  if (pending.power) {
    gameState.powerQueue.push({
      type: pending.power,
      controllerId: reactorId,
      card: pending.cardRef,
    });
  }

  gameState.stealGivePending = null;

  return {
    success: true,
    stealGiveCompleted: true,
    reactorId,
    victimId: pending.victimId,
    power: pending.power,
  };
}

/**
 * Phase 1 blind steal: tap an opponent’s face-down card you think matches the pile.
 * Match → card goes to pile; reactor must then choose a card to give (completeStealGive).
 * Wrong rank → reveal, move that card to the right end of reactor’s hand, penalty draw.
 */
export function handleStealReaction(gameState, reactorId, targetPlayerId, targetCardIndex, giveCardIndex) {
  if (gameState.stealGivePending) {
    if (giveCardIndex === undefined || giveCardIndex === null) {
      return { error: 'Choose a card to give the other player' };
    }
    if (targetPlayerId !== undefined || targetCardIndex !== undefined) {
      return { error: 'Finish your steal trade first' };
    }
    return completeStealGive(gameState, reactorId, giveCardIndex);
  }

  if (giveCardIndex !== undefined && giveCardIndex !== null) {
    return { error: 'Tap an opponent card first to call a blind steal' };
  }

  const rw = gameState.reactionWindow;
  if (!rw.active) return { error: 'No active reaction window' };
  if (rw.attemptedPlayers.has(reactorId)) return { error: 'Already attempted this window' };

  const reactor = gameState.getPlayer(reactorId);
  const victim = gameState.getPlayer(targetPlayerId);
  if (!reactor || !victim) return { error: 'Player not found' };
  if (reactor.hand.length < 1) {
    return { error: 'You need at least one card to trade if your call is right' };
  }
  if (reactorId === targetPlayerId) return { error: 'Cannot steal from yourself — use own card reaction' };
  if (targetCardIndex < 0 || targetCardIndex >= victim.hand.length) return { error: 'Invalid target card index' };

  rw.attemptedPlayers.add(reactorId);
  const prospectCard = victim.hand[targetCardIndex];
  const pileRank = getEffectiveRank(rw.cardOnPile);
  const prospectRank = getEffectiveRank(prospectCard);
  const isMatch = pileRank === prospectRank;

  const prospectReveal = [{ ...publicCard(prospectCard), role: 'called' }];

  if (isMatch && rw.firstSuccessful === null) {
    rw.firstSuccessful = reactorId;
    victim.hand.splice(targetCardIndex, 1);
    victim.knownCardIds.delete(prospectCard.id);
    gameState.playPile.push(prospectCard);

    const power = isPowerCard(prospectCard) ? getPowerType(prospectCard) : null;
    gameState.stealGivePending = {
      reactorId,
      victimId: targetPlayerId,
      cardRef: prospectCard,
      power,
    };
    gameState.phase = 'steal-give';

    return {
      success: true,
      correct: true,
      penalty: false,
      needStealGive: true,
      reactorId,
      victimId: targetPlayerId,
      card: prospectCard,
      power,
      revealCards: prospectReveal,
    };
  }

  gameState.ensureDrawDeck();
  const penaltyCard = gameState.drawDeck.length > 0 ? gameState.drawDeck.pop() : null;
  if (penaltyCard) {
    reactor.hand.push(penaltyCard);
  }

  if (!isMatch) {
    victim.hand.splice(targetCardIndex, 1);
    victim.knownCardIds.delete(prospectCard.id);
    reactor.hand.push(prospectCard);
  }

  return {
    success: true,
    correct: false,
    reactorId,
    victimId: targetPlayerId,
    penalty: true,
    penaltyCard: penaltyCard ? { id: penaltyCard.id } : null,
    reason: !isMatch
      ? 'Wrong card — it joins your hand and you draw a penalty'
      : 'Too slow — someone reacted first',
    revealCards: prospectReveal,
  };
}

export function closeWindow(gameState) {
  if (gameState.reactionWindow.timer) {
    clearTimeout(gameState.reactionWindow.timer);
  }
  gameState.reactionWindow = {
    active: false,
    cardOnPile: null,
    playedBy: null,
    attemptedPlayers: new Set(),
    firstSuccessful: null,
    timer: null,
    windowStart: null,
  };
}

export function isWindowActive(gameState) {
  return gameState.reactionWindow.active;
}
