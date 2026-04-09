// ==========================================
// PokerZone - Deck Management
// ==========================================

import { Card, Rank, Suit, GameVariant } from './types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SHORT_DECK_RANKS: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const SUIT_CODES: Record<Suit, string> = {
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
  spades: 's',
};

function createCard(rank: Rank, suit: Suit): Card {
  return {
    rank,
    suit,
    code: `${rank}${SUIT_CODES[suit]}`,
  };
}

function createFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

function createShortDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of SHORT_DECK_RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

// Fisher-Yates shuffle with cryptographic-quality randomness where available
function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use crypto.getRandomValues if available for better randomness
    let j: number;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      j = arr[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export class Deck {
  private cards: Card[];
  private dealtIndex: number;

  constructor(variant: GameVariant = 'texas-holdem') {
    this.cards = variant === 'short-deck' ? createShortDeck() : createFullDeck();
    this.dealtIndex = 0;
    this.shuffle();
  }

  shuffle(): void {
    this.cards = shuffle(this.cards);
    this.dealtIndex = 0;
  }

  deal(count: number = 1): Card[] {
    if (this.dealtIndex + count > this.cards.length) {
      throw new Error('Not enough cards in deck');
    }
    const dealt = this.cards.slice(this.dealtIndex, this.dealtIndex + count);
    this.dealtIndex += count;
    return dealt;
  }

  dealOne(): Card {
    return this.deal(1)[0];
  }

  burn(): void {
    this.dealtIndex++;
  }

  remaining(): number {
    return this.cards.length - this.dealtIndex;
  }

  reset(variant: GameVariant = 'texas-holdem'): void {
    this.cards = variant === 'short-deck' ? createShortDeck() : createFullDeck();
    this.dealtIndex = 0;
    this.shuffle();
  }
}

export { SUITS, RANKS, SHORT_DECK_RANKS, SUIT_CODES };
