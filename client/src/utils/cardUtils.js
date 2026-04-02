const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  joker: '★',
};

const SUIT_COLORS = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
  joker: 'text-purple-600',
};

export function getSuitSymbol(suit) {
  return SUIT_SYMBOLS[suit] || '?';
}

export function getSuitColor(suit) {
  return SUIT_COLORS[suit] || 'text-gray-900';
}

export function getDisplayRank(rank) {
  return rank === 'Joker' ? '★' : rank;
}

export function getCardLabel(card) {
  if (!card || !card.rank) return '?';
  if (card.rank === 'Joker') return 'Joker ★';
  return `${card.rank}${SUIT_SYMBOLS[card.suit] || ''}`;
}

export function getPointValue(card) {
  if (!card) return 0;
  if (card.rank === 'Joker') return -1;
  if (card.rank === 'A') return 1;
  if (card.rank === '10') return 0;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

export function isPowerCard(card) {
  return card && ['J', 'Q', 'K'].includes(card.rank);
}

export function isRedSuit(suit) {
  return suit === 'hearts' || suit === 'diamonds';
}
