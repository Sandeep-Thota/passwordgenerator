// ==========================================
// PokerZone - Hand Evaluator
// ==========================================
// Evaluates poker hands and determines winners.
// Supports Texas Hold'em, Omaha, and Short Deck.

import { Card, HandResult, HandRank, Rank, Suit, GameVariant } from './types';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

const HAND_RANKINGS: Record<HandRank, number> = {
  'High Card': 1,
  'One Pair': 2,
  'Two Pair': 3,
  'Three of a Kind': 4,
  'Straight': 5,
  'Flush': 6,
  'Full House': 7,
  'Four of a Kind': 8,
  'Straight Flush': 9,
  'Royal Flush': 10,
};

// Short deck: flush beats full house
const SHORT_DECK_RANKINGS: Record<HandRank, number> = {
  'High Card': 1,
  'One Pair': 2,
  'Two Pair': 3,
  'Straight': 4,
  'Three of a Kind': 5,
  'Full House': 6,
  'Flush': 7,
  'Four of a Kind': 8,
  'Straight Flush': 9,
  'Royal Flush': 10,
};

function getRankValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

function sortByRankDesc(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
}

// Generate all combinations of k items from array
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];
  const first = arr[0];
  const rest = arr.slice(1);
  // Combinations that include first
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  // Combinations that exclude first
  for (const combo of combinations(rest, k)) {
    result.push(combo);
  }
  return result;
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit);
}

function isStraight(cards: Card[], variant: GameVariant = 'texas-holdem'): boolean {
  const sorted = sortByRankDesc(cards);
  const values = sorted.map(c => getRankValue(c.rank));

  // Check normal straight
  let isStraightNormal = true;
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      isStraightNormal = false;
      break;
    }
  }
  if (isStraightNormal) return true;

  // Check wheel (A-2-3-4-5) for standard deck
  if (variant !== 'short-deck') {
    if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
      return true;
    }
  }

  // Short deck wheel: A-6-7-8-9
  if (variant === 'short-deck') {
    if (values[0] === 14 && values[1] === 9 && values[2] === 8 && values[3] === 7 && values[4] === 6) {
      return true;
    }
  }

  return false;
}

function getStraightHighCard(cards: Card[], variant: GameVariant = 'texas-holdem'): number {
  const values = sortByRankDesc(cards).map(c => getRankValue(c.rank));

  // Check wheel - Ace plays low
  if (variant !== 'short-deck' && values[0] === 14 && values[1] === 5) {
    return 5;
  }
  if (variant === 'short-deck' && values[0] === 14 && values[1] === 9) {
    return 9;
  }
  return values[0];
}

function getGroupedRanks(cards: Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>();
  for (const card of cards) {
    const existing = groups.get(card.rank) || [];
    existing.push(card);
    groups.set(card.rank, existing);
  }
  return groups;
}

function evaluate5Cards(cards: Card[], variant: GameVariant = 'texas-holdem'): HandResult {
  const rankings = variant === 'short-deck' ? SHORT_DECK_RANKINGS : HAND_RANKINGS;
  const sorted = sortByRankDesc(cards);
  const flush = isFlush(cards);
  const straight = isStraight(cards, variant);
  const groups = getGroupedRanks(cards);

  const groupSizes = Array.from(groups.values())
    .map(g => ({ rank: g[0].rank, count: g.length }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return getRankValue(b.rank) - getRankValue(a.rank);
    });

  // Royal Flush
  if (flush && straight && sorted[0].rank === 'A' && sorted[1].rank === 'K') {
    return {
      rank: 'Royal Flush',
      score: rankings['Royal Flush'] * 10000000000,
      cards: sorted,
      description: `Royal Flush`,
    };
  }

  // Straight Flush
  if (flush && straight) {
    const high = getStraightHighCard(cards, variant);
    return {
      rank: 'Straight Flush',
      score: rankings['Straight Flush'] * 10000000000 + high,
      cards: sorted,
      description: `Straight Flush, ${sorted[0].rank} high`,
    };
  }

  // Four of a Kind
  if (groupSizes[0].count === 4) {
    const quadRank = groupSizes[0].rank;
    const kicker = groupSizes[1].rank;
    return {
      rank: 'Four of a Kind',
      score: rankings['Four of a Kind'] * 10000000000 + getRankValue(quadRank) * 100 + getRankValue(kicker),
      cards: sorted,
      description: `Four ${quadRank}s`,
    };
  }

  // Full House
  if (groupSizes[0].count === 3 && groupSizes[1].count === 2) {
    const tripRank = groupSizes[0].rank;
    const pairRank = groupSizes[1].rank;
    return {
      rank: 'Full House',
      score: rankings['Full House'] * 10000000000 + getRankValue(tripRank) * 100 + getRankValue(pairRank),
      cards: sorted,
      description: `${tripRank}s full of ${pairRank}s`,
    };
  }

  // Flush
  if (flush) {
    const values = sorted.map(c => getRankValue(c.rank));
    const score = rankings['Flush'] * 10000000000 +
      values[0] * 100000000 + values[1] * 1000000 + values[2] * 10000 + values[3] * 100 + values[4];
    return {
      rank: 'Flush',
      score,
      cards: sorted,
      description: `Flush, ${sorted[0].rank} high`,
    };
  }

  // Straight
  if (straight) {
    const high = getStraightHighCard(cards, variant);
    return {
      rank: 'Straight',
      score: rankings['Straight'] * 10000000000 + high,
      cards: sorted,
      description: `Straight, ${high === 14 ? 'Ace' : high} high`,
    };
  }

  // Three of a Kind
  if (groupSizes[0].count === 3) {
    const tripRank = groupSizes[0].rank;
    const kickers = groupSizes.slice(1).map(g => getRankValue(g.rank)).sort((a, b) => b - a);
    return {
      rank: 'Three of a Kind',
      score: rankings['Three of a Kind'] * 10000000000 + getRankValue(tripRank) * 10000 + kickers[0] * 100 + kickers[1],
      cards: sorted,
      description: `Three ${tripRank}s`,
    };
  }

  // Two Pair
  if (groupSizes[0].count === 2 && groupSizes[1].count === 2) {
    const highPair = getRankValue(groupSizes[0].rank) > getRankValue(groupSizes[1].rank) ? groupSizes[0].rank : groupSizes[1].rank;
    const lowPair = getRankValue(groupSizes[0].rank) > getRankValue(groupSizes[1].rank) ? groupSizes[1].rank : groupSizes[0].rank;
    const kicker = getRankValue(groupSizes[2].rank);
    return {
      rank: 'Two Pair',
      score: rankings['Two Pair'] * 10000000000 + getRankValue(highPair) * 10000 + getRankValue(lowPair) * 100 + kicker,
      cards: sorted,
      description: `${highPair}s and ${lowPair}s`,
    };
  }

  // One Pair
  if (groupSizes[0].count === 2) {
    const pairRank = groupSizes[0].rank;
    const kickers = groupSizes.slice(1).map(g => getRankValue(g.rank)).sort((a, b) => b - a);
    return {
      rank: 'One Pair',
      score: rankings['One Pair'] * 10000000000 + getRankValue(pairRank) * 1000000 + kickers[0] * 10000 + kickers[1] * 100 + kickers[2],
      cards: sorted,
      description: `Pair of ${pairRank}s`,
    };
  }

  // High Card
  const values = sorted.map(c => getRankValue(c.rank));
  const score = rankings['High Card'] * 10000000000 +
    values[0] * 100000000 + values[1] * 1000000 + values[2] * 10000 + values[3] * 100 + values[4];
  return {
    rank: 'High Card',
    score,
    cards: sorted,
    description: `${sorted[0].rank} high`,
  };
}

// Evaluate best hand from any number of cards (picks best 5)
export function evaluateHand(
  holeCards: Card[],
  communityCards: Card[],
  variant: GameVariant = 'texas-holdem'
): HandResult {
  if (variant === 'omaha') {
    return evaluateOmaha(holeCards, communityCards);
  }

  const allCards = [...holeCards, ...communityCards];

  // Need at least 5 cards to evaluate
  if (allCards.length < 5) {
    // Return a basic high-card result from available cards
    const sorted = [...allCards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
    return {
      rank: 'High Card',
      score: sorted.reduce((s, c, i) => s + getRankValue(c.rank) * Math.pow(100, 4 - i), 10000000000),
      cards: sorted,
      description: sorted.length > 0 ? `${sorted[0].rank} high` : 'No cards',
    };
  }

  const combos = combinations(allCards, 5);

  let bestResult: HandResult | null = null;
  for (const combo of combos) {
    const result = evaluate5Cards(combo, variant);
    if (!bestResult || result.score > bestResult.score) {
      bestResult = result;
    }
  }

  return bestResult!;
}

// Omaha: must use exactly 2 hole cards and 3 community cards
function evaluateOmaha(holeCards: Card[], communityCards: Card[]): HandResult {
  const holeCombos = combinations(holeCards, 2);
  const communityCombos = combinations(communityCards, 3);

  let bestResult: HandResult | null = null;
  for (const hole of holeCombos) {
    for (const community of communityCombos) {
      const result = evaluate5Cards([...hole, ...community]);
      if (!bestResult || result.score > bestResult.score) {
        bestResult = result;
      }
    }
  }

  return bestResult!;
}

// Compare two hands, returns positive if hand1 wins, negative if hand2 wins, 0 if tie
export function compareHands(hand1: HandResult, hand2: HandResult): number {
  return hand1.score - hand2.score;
}

// Determine winners from multiple players
export function determineWinners(
  players: { id: string; holeCards: Card[] }[],
  communityCards: Card[],
  variant: GameVariant = 'texas-holdem'
): { playerId: string; hand: HandResult }[] {
  const results = players.map(p => ({
    playerId: p.id,
    hand: evaluateHand(p.holeCards, communityCards, variant),
  }));

  results.sort((a, b) => b.hand.score - a.hand.score);

  const bestScore = results[0].hand.score;
  return results.filter(r => r.hand.score === bestScore);
}

// Get hand strength as a percentage (for UI display)
export function getHandStrength(
  holeCards: Card[],
  communityCards: Card[],
  variant: GameVariant = 'texas-holdem'
): number {
  if (holeCards.length === 0) return 0;

  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) {
    // Not enough cards to evaluate a full hand — estimate from hole cards alone
    const RANK_VALUES_MAP: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    };
    const values = holeCards.map(c => RANK_VALUES_MAP[c.rank] || 0);
    const maxVal = Math.max(...values);
    const isPair = holeCards.length >= 2 && holeCards[0].rank === holeCards[1].rank;
    const isSuited = holeCards.length >= 2 && holeCards[0].suit === holeCards[1].suit;
    let strength = (maxVal / 14) * 40; // base from high card
    if (isPair) strength += 30;
    if (isSuited) strength += 8;
    if (holeCards.length >= 2) {
      const gap = Math.abs(values[0] - values[1]);
      if (gap <= 2) strength += 10; // connected
    }
    return Math.min(100, Math.round(strength));
  }

  const result = evaluateHand(holeCards, communityCards, variant);
  if (!result) return 0;

  const rankings = variant === 'short-deck' ? SHORT_DECK_RANKINGS : HAND_RANKINGS;

  // Normalize score to 0-100
  const maxPossible = rankings['Royal Flush'] * 10000000000 + 14;
  return Math.min(100, Math.round((result.score / maxPossible) * 100 * 10));
}

export { RANK_VALUES, HAND_RANKINGS, combinations };
