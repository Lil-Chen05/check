export function resolveJack(gameState, playerId, cardIndex) {
  const player = gameState.getPlayer(playerId);
  if (!player) return { error: 'Player not found' };
  if (cardIndex < 0 || cardIndex >= player.hand.length) return { error: 'Invalid card index' };

  const card = player.hand[cardIndex];
  player.knownCardIds.add(card.id);

  return {
    success: true,
    peekedCard: { id: card.id, rank: card.rank, suit: card.suit },
    cardIndex,
  };
}

export function resolveQueen(gameState, playerId, pos1, pos2) {
  if (pos1.playerId === pos2.playerId && pos1.cardIndex === pos2.cardIndex) {
    return { error: 'Cannot swap a card with itself' };
  }

  const player1 = gameState.getPlayer(pos1.playerId);
  const player2 = gameState.getPlayer(pos2.playerId);
  if (!player1 || !player2) return { error: 'Player not found' };
  if (pos1.cardIndex < 0 || pos1.cardIndex >= player1.hand.length) return { error: 'Invalid card index' };
  if (pos2.cardIndex < 0 || pos2.cardIndex >= player2.hand.length) return { error: 'Invalid card index' };

  const temp = player1.hand[pos1.cardIndex];
  player1.hand[pos1.cardIndex] = player2.hand[pos2.cardIndex];
  player2.hand[pos2.cardIndex] = temp;

  return { success: true };
}

export function resolveRedKing(gameState, playerId, targetPlayerId) {
  const targetPlayer = gameState.getPlayer(targetPlayerId);
  if (!targetPlayer) return { error: 'Target player not found' };

  gameState.ensureDrawDeck();
  if (gameState.drawDeck.length === 0) return { error: 'No cards in deck' };

  const newCard = gameState.drawDeck.pop();
  targetPlayer.hand.push(newCard);

  return {
    success: true,
    targetPlayerId,
    cardsAdded: 1,
  };
}

export function resolveBlackKingPeek(gameState, playerId, targetPlayerId, cardIndex) {
  const targetPlayer = gameState.getPlayer(targetPlayerId);
  if (!targetPlayer) return { error: 'Target player not found' };
  if (cardIndex < 0 || cardIndex >= targetPlayer.hand.length) return { error: 'Invalid card index' };

  const card = targetPlayer.hand[cardIndex];
  const player = gameState.getPlayer(playerId);
  player.knownCardIds.add(card.id);

  return {
    success: true,
    peekedCard: { id: card.id, rank: card.rank, suit: card.suit },
    targetPlayerId,
    cardIndex,
  };
}

export function resolveBlackKingSwap(gameState, playerId, fromPos, toPos) {
  if (fromPos.playerId === toPos.playerId && fromPos.cardIndex === toPos.cardIndex) {
    return { error: 'Must swap to a different position' };
  }

  const player1 = gameState.getPlayer(fromPos.playerId);
  const player2 = gameState.getPlayer(toPos.playerId);
  if (!player1 || !player2) return { error: 'Player not found' };
  if (fromPos.cardIndex < 0 || fromPos.cardIndex >= player1.hand.length) return { error: 'Invalid card index' };
  if (toPos.cardIndex < 0 || toPos.cardIndex >= player2.hand.length) return { error: 'Invalid card index' };

  const temp = player1.hand[fromPos.cardIndex];
  player1.hand[fromPos.cardIndex] = player2.hand[toPos.cardIndex];
  player2.hand[toPos.cardIndex] = temp;

  return { success: true };
}
