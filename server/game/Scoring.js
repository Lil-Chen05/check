import { getCardPoints } from './Deck.js';

export function calculateScores(players, checkCallerIndex) {
  const results = players.map((player, index) => {
    const points = player.hand.reduce((sum, card) => sum + getCardPoints(card), 0);
    return {
      id: player.id,
      displayName: player.displayName,
      hand: player.hand,
      points,
      cardCount: player.hand.length,
      playerIndex: index,
    };
  });

  results.sort((a, b) => {
    if (a.points !== b.points) return a.points - b.points;
    if (a.cardCount !== b.cardCount) return a.cardCount - b.cardCount;
    return tiebreakByTurnDistance(a.playerIndex, b.playerIndex, checkCallerIndex, players.length);
  });

  return results.map((r, rank) => ({ ...r, rank: rank + 1 }));
}

function tiebreakByTurnDistance(indexA, indexB, callerIndex, total) {
  const distA = (indexA - callerIndex + total) % total || total;
  const distB = (indexB - callerIndex + total) % total || total;
  return distB - distA;
}
