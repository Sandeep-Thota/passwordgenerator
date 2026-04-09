// ==========================================
// PokerZone - Card Constants & Display
// ==========================================

import { Rank, Suit } from '../engine/types';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: '#EF4444',
  diamonds: '#EF4444',
  clubs: '#1E293B',
  spades: '#1E293B',
};

export const RANK_DISPLAY: Record<Rank | '?', string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
  '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  '?': '?',
};

export const HAND_RANK_DESCRIPTIONS: Record<string, string> = {
  'Royal Flush': 'The highest possible hand - A, K, Q, J, 10 of the same suit',
  'Straight Flush': 'Five consecutive cards of the same suit',
  'Four of a Kind': 'Four cards of the same rank',
  'Full House': 'Three of a kind plus a pair',
  'Flush': 'Five cards of the same suit',
  'Straight': 'Five consecutive cards of different suits',
  'Three of a Kind': 'Three cards of the same rank',
  'Two Pair': 'Two different pairs',
  'One Pair': 'Two cards of the same rank',
  'High Card': 'No matching cards - highest card plays',
};

// Seat positions around the table (normalized 0-1 coordinates)
// For up to 9 players
export const SEAT_POSITIONS: { x: number; y: number }[] = [
  { x: 0.50, y: 0.92 }, // Seat 0 - Bottom center (hero)
  { x: 0.15, y: 0.80 }, // Seat 1 - Bottom left
  { x: 0.03, y: 0.55 }, // Seat 2 - Left
  { x: 0.10, y: 0.25 }, // Seat 3 - Top left
  { x: 0.30, y: 0.08 }, // Seat 4 - Top left center
  { x: 0.70, y: 0.08 }, // Seat 5 - Top right center
  { x: 0.90, y: 0.25 }, // Seat 6 - Top right
  { x: 0.97, y: 0.55 }, // Seat 7 - Right
  { x: 0.85, y: 0.80 }, // Seat 8 - Bottom right
];

export const CHIP_VALUES = [
  { value: 1, color: '#F8FAFC', label: '1' },
  { value: 5, color: '#EF4444', label: '5' },
  { value: 10, color: '#3B82F6', label: '10' },
  { value: 25, color: '#22C55E', label: '25' },
  { value: 100, color: '#1E293B', label: '100' },
  { value: 500, color: '#A855F7', label: '500' },
  { value: 1000, color: '#F97316', label: '1K' },
  { value: 5000, color: '#EAB308', label: '5K' },
  { value: 10000, color: '#D4AF37', label: '10K' },
];

export function getChipBreakdown(amount: number): { value: number; count: number; color: string }[] {
  const breakdown: { value: number; count: number; color: string }[] = [];
  let remaining = amount;

  for (let i = CHIP_VALUES.length - 1; i >= 0; i--) {
    const chip = CHIP_VALUES[i];
    const count = Math.floor(remaining / chip.value);
    if (count > 0) {
      breakdown.push({ value: chip.value, count, color: chip.color });
      remaining -= count * chip.value;
    }
  }

  return breakdown;
}

// Card back design SVG data
export const CARD_BACK_PATTERN = 'diamond-grid';
