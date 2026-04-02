const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function createDeck(playerCount) {
  const deckCount = playerCount <= 6 ? 1 : 2;
  const cards = [];

  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: generateId(), rank, suit });
      }
    }
    cards.push({ id: generateId(), rank: 'Joker', suit: 'joker' });
    cards.push({ id: generateId(), rank: 'Joker', suit: 'joker' });
  }

  return shuffle(cards);
}

export function shuffle(cards) {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function isPowerCard(card) {
  return card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';
}

export function getPowerType(card) {
  if (card.rank === 'J') return 'jack';
  if (card.rank === 'Q') return 'queen';
  if (card.rank === 'K') {
    return isRedSuit(card.suit) ? 'red-king' : 'black-king';
  }
  return null;
}

export function isRedSuit(suit) {
  return suit === 'hearts' || suit === 'diamonds';
}

export function getEffectiveRank(card) {
  if (card.rank === 'K') {
    return isRedSuit(card.suit) ? 'K-red' : 'K-black';
  }
  return card.rank;
}

export function getCardPoints(card) {
  if (card.rank === 'Joker') return -1;
  if (card.rank === 'A') return 1;
  if (card.rank === '10') return 0;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return parseInt(card.rank, 10);
}

export function flipStartingCard(drawDeck) {
  let card = drawDeck.pop();
  while (isPowerCard(card)) {
    drawDeck.unshift(card);
    const shuffled = shuffle(drawDeck);
    drawDeck.length = 0;
    shuffled.forEach(c => drawDeck.push(c));
    card = drawDeck.pop();
  }
  return card;
}
