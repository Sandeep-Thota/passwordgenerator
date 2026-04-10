// ==========================================
// PokerZone - Pro-Level AI Bot Engine
// ==========================================
// Bots that think like real poker players:
// - Pre-flop hand ranges by position
// - Pot odds and equity calculations
// - Continuation betting, check-raising
// - Board texture reads and bet sizing
// - Multi-street planning
// - Opponent tendency exploitation

import {
  Card,
  GameState,
  GamePhase,
  Player,
  PlayerAction,
  PlayerActionRequest,
  GameVariant,
  Rank,
} from './types';
import { getHandStrength } from './hand-evaluator';

// ==========================================
// Types
// ==========================================

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotConfig {
  id: string;
  name: string;
  difficulty: BotDifficulty;
  avatar: string;
  personality: string;
}

export interface BotMemory {
  handsPlayed: number;
  playerFoldRate: number;
  playerRaiseRate: number;
  playerCallRate: number;
  totalPlayerActions: number;
  // Track if we were the pre-flop raiser (for c-bet logic)
  wasPreFlopRaiser: boolean;
  lastPreFlopAction: PlayerAction | null;
}

// ==========================================
// Bot Names & Personalities
// ==========================================

const BOT_PROFILES: { name: string; avatar: string; personality: string }[] = [
  { name: 'BluffBot', avatar: 'wolf', personality: 'Loves to bluff and keep you guessing' },
  { name: 'FoldMaster', avatar: 'eagle', personality: 'Patience is a virtue' },
  { name: 'RiverRat', avatar: 'shark', personality: 'Always catches that miracle river card' },
  { name: 'NitNancy', avatar: 'bear', personality: 'Tighter than a drum' },
  { name: 'AgroAndy', avatar: 'tiger', personality: 'Aggression is the only language' },
  { name: 'CallingStation', avatar: 'fox', personality: 'Will call you down with bottom pair' },
  { name: 'TightTony', avatar: 'hawk', personality: 'Plays premium hands only' },
  { name: 'LooseLouis', avatar: 'joker', personality: 'Any two cards can win, right?' },
  { name: 'SharkyAI', avatar: 'cobra', personality: 'Smells blood in the water' },
  { name: 'TheGrinder', avatar: 'rhino', personality: 'Slow and steady wins the stack' },
  { name: 'LuckyLucy', avatar: 'phoenix', personality: 'Fortune favors the bold' },
  { name: 'MathBot', avatar: 'ace', personality: 'Calculates every pot odd' },
  { name: 'WildCard', avatar: 'dragon', personality: 'Unpredictable and proud of it' },
  { name: 'IceCold', avatar: 'panther', personality: 'Never tilts, never shows emotion' },
  { name: 'PhilTheThrill', avatar: 'king', personality: 'Every hand is a TV final table' },
];

// ==========================================
// Pre-flop Hand Rankings (Sklansky-like groups)
// ==========================================

const RANK_VAL: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

// Returns a pre-flop hand score from 0-100 based on starting hand charts
function getPreFlopHandScore(cards: Card[]): number {
  if (cards.length < 2) return 20;
  const v1 = RANK_VAL[cards[0].rank] || 0;
  const v2 = RANK_VAL[cards[1].rank] || 0;
  const high = Math.max(v1, v2);
  const low = Math.min(v1, v2);
  const isPair = v1 === v2;
  const isSuited = cards[0].suit === cards[1].suit;
  const gap = high - low;

  // Pocket pairs
  if (isPair) {
    if (high >= 13) return 95; // AA, KK
    if (high >= 12) return 88; // QQ
    if (high >= 11) return 83; // JJ
    if (high >= 10) return 78; // TT
    if (high >= 8) return 65;  // 99, 88
    if (high >= 6) return 55;  // 77, 66
    return 45; // small pairs
  }

  // High card combos
  let score = (high + low) / 28 * 50; // base from card values

  // Suited bonus
  if (isSuited) score += 8;

  // Connected bonus
  if (gap === 1) score += 10;
  else if (gap === 2) score += 6;
  else if (gap === 3) score += 3;

  // Premium hands
  if (high === 14 && low === 13) score = isSuited ? 92 : 87; // AK
  if (high === 14 && low === 12) score = isSuited ? 82 : 75; // AQ
  if (high === 14 && low === 11) score = isSuited ? 78 : 70; // AJ
  if (high === 14 && low === 10) score = isSuited ? 74 : 66; // AT
  if (high === 13 && low === 12) score = isSuited ? 76 : 68; // KQ
  if (high === 13 && low === 11) score = isSuited ? 72 : 63; // KJ

  // Suited connectors
  if (isSuited && gap === 1 && high >= 6 && high <= 10) score = Math.max(score, 58);
  if (isSuited && gap === 1 && high >= 10) score = Math.max(score, 68);

  // Suited aces
  if (isSuited && high === 14) score = Math.max(score, 62);

  // Junk penalty for big gaps
  if (gap >= 5 && high < 12) score -= 15;

  return Math.max(5, Math.min(100, score));
}

// ==========================================
// Bot Creation
// ==========================================

export function createBot(difficulty: BotDifficulty, index: number): BotConfig {
  const profile = BOT_PROFILES[index % BOT_PROFILES.length];
  return {
    id: `bot-${difficulty}-${index}-${Date.now()}`,
    name: profile.name,
    difficulty,
    avatar: profile.avatar,
    personality: profile.personality,
  };
}

// ==========================================
// Bot Memory
// ==========================================

const botMemories = new Map<string, BotMemory>();

export function getBotMemory(botId: string): BotMemory {
  if (!botMemories.has(botId)) {
    botMemories.set(botId, {
      handsPlayed: 0,
      playerFoldRate: 0.3,
      playerRaiseRate: 0.2,
      playerCallRate: 0.3,
      totalPlayerActions: 0,
      wasPreFlopRaiser: false,
      lastPreFlopAction: null,
    });
  }
  return botMemories.get(botId)!;
}

export function updateBotMemory(botId: string, playerAction: PlayerAction): void {
  const memory = getBotMemory(botId);
  memory.totalPlayerActions++;
  const n = memory.totalPlayerActions;

  if (playerAction === 'fold') {
    memory.playerFoldRate += (1 - memory.playerFoldRate) / n;
    memory.playerRaiseRate += (0 - memory.playerRaiseRate) / n;
    memory.playerCallRate += (0 - memory.playerCallRate) / n;
  } else if (playerAction === 'raise' || playerAction === 'bet') {
    memory.playerFoldRate += (0 - memory.playerFoldRate) / n;
    memory.playerRaiseRate += (1 - memory.playerRaiseRate) / n;
    memory.playerCallRate += (0 - memory.playerCallRate) / n;
  } else if (playerAction === 'call') {
    memory.playerFoldRate += (0 - memory.playerFoldRate) / n;
    memory.playerRaiseRate += (0 - memory.playerRaiseRate) / n;
    memory.playerCallRate += (1 - memory.playerCallRate) / n;
  }
}

export function clearBotMemories(): void {
  botMemories.clear();
}

// ==========================================
// Shared Analysis Helpers
// ==========================================

interface GameContext {
  potSize: number;
  highestBet: number;
  toCall: number;
  potOdds: number;         // fraction of pot we need to call
  stackToPot: number;      // effective stack / pot (SPR)
  numOpponents: number;
  position: number;        // 0-1, 1 = button
  phase: GamePhase;
  handStrength: number;    // 0-100
  preFlopScore: number;    // 0-100
  board: BoardTexture;
  isRaised: boolean;       // someone has raised this round
  facingBigBet: boolean;   // toCall > 50% pot
}

interface BoardTexture {
  isDry: boolean;
  isWet: boolean;
  isScary: boolean;
  hasPair: boolean;
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;
  hasFlush: boolean;        // 4+ of one suit on board
  highCardCount: number;    // cards >= 10
  isMonotone: boolean;      // all one suit
}

function analyzeGame(player: Player, gameState: GameState): GameContext {
  const potSize = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const highestBet = Math.max(0, ...gameState.players.map(p => p.currentBet));
  const toCall = highestBet - player.currentBet;
  const potOdds = potSize > 0 && toCall > 0 ? toCall / (potSize + toCall) : 0;
  const activePlayers = gameState.players.filter(p => !p.isFolded && !p.isSittingOut);
  const numOpponents = activePlayers.length - 1;

  const playerIdx = gameState.players.indexOf(player);
  const position = getPositionScore(playerIdx, gameState.dealerIndex, gameState.players.length, activePlayers.length);

  const handStrength = getHandStrength(player.cards, gameState.communityCards, gameState.variant);
  const preFlopScore = getPreFlopHandScore(player.cards);

  const effectiveStack = Math.min(player.chips, ...activePlayers.filter(p => p.id !== player.id).map(p => p.chips));
  const stackToPot = potSize > 0 ? effectiveStack / potSize : 10;

  return {
    potSize,
    highestBet,
    toCall,
    potOdds,
    stackToPot,
    numOpponents,
    position,
    phase: gameState.phase,
    handStrength,
    preFlopScore,
    board: analyzeBoardTexture(gameState.communityCards),
    isRaised: highestBet > gameState.bigBlindAmount,
    facingBigBet: toCall > potSize * 0.5,
  };
}

function analyzeBoardTexture(cards: Card[]): BoardTexture {
  if (cards.length === 0) {
    return { isDry: true, isWet: false, isScary: false, hasPair: false, hasFlushDraw: false, hasStraightDraw: false, hasFlush: false, highCardCount: 0, isMonotone: false };
  }

  const rankCounts = new Map<string, number>();
  const suitCounts = new Map<string, number>();
  for (const card of cards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  }

  const hasPair = Array.from(rankCounts.values()).some(c => c >= 2);
  const maxSuit = Math.max(0, ...Array.from(suitCounts.values()));
  const hasFlushDraw = maxSuit >= 3;
  const hasFlush = maxSuit >= 4;
  const isMonotone = maxSuit === cards.length && cards.length >= 3;

  const values = cards.map(c => RANK_VAL[c.rank] || 0).sort((a, b) => a - b);
  let hasStraightDraw = false;
  if (values.length >= 3) {
    for (let i = 0; i < values.length - 2; i++) {
      if (values[i + 2] - values[i] <= 4) { hasStraightDraw = true; break; }
    }
  }

  const highCardCount = cards.filter(c => (RANK_VAL[c.rank] || 0) >= 10).length;
  const isWet = hasFlushDraw || hasStraightDraw;
  const isDry = !isWet && !hasPair;
  const isScary = isWet || hasPair || highCardCount >= 3 || hasFlush;

  return { isDry, isWet, isScary, hasPair, hasFlushDraw, hasStraightDraw, hasFlush, highCardCount, isMonotone };
}

function getPositionScore(playerIdx: number, dealerIdx: number, totalPlayers: number, activePlayers: number): number {
  if (activePlayers <= 1) return 0.5;
  const seatsFromDealer = (playerIdx - dealerIdx + totalPlayers) % totalPlayers;
  if (seatsFromDealer === 0) return 1.0;
  return seatsFromDealer / totalPlayers;
}

// Smart bet sizing as a fraction of pot
function sizeBet(potSize: number, fraction: number, minBet: number, maxBet: number): number {
  return Math.max(minBet, Math.min(Math.floor(potSize * fraction), maxBet));
}

// ==========================================
// Main Decision Function
// ==========================================

export function getBotAction(
  botConfig: BotConfig,
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  switch (botConfig.difficulty) {
    case 'easy':
      return getEasyAction(player, gameState, validActions, minBet, maxBet);
    case 'medium':
      return getMediumAction(botConfig, player, gameState, validActions, minBet, maxBet);
    case 'hard':
      return getHardAction(botConfig, player, gameState, validActions, minBet, maxBet);
    default:
      return getEasyAction(player, gameState, validActions, minBet, maxBet);
  }
}

// ==========================================
// Easy Bot — Recreational player
// Plays too many hands, calls too much, rarely bluffs
// ==========================================

function getEasyAction(
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  const rand = Math.random();

  // Always check if free
  if (validActions.includes('check') && rand < 0.7) {
    return { action: 'check' };
  }

  // Call most bets (calling station behavior)
  if (validActions.includes('call') && rand < 0.65) {
    return { action: 'call' };
  }

  // Occasional min-raise
  if (validActions.includes('raise') && rand < 0.12) {
    return { action: 'raise', amount: minBet };
  }

  // Rarely all-in
  if (validActions.includes('all-in') && rand < 0.02) {
    return { action: 'all-in' };
  }

  if (validActions.includes('check')) return { action: 'check' };
  if (validActions.includes('call')) return { action: 'call' };
  return { action: 'fold' };
}

// ==========================================
// Medium Bot — Solid TAG (Tight Aggressive)
// Plays good starting hands, bets for value,
// understands pot odds, does basic c-betting
// ==========================================

function getMediumAction(
  botConfig: BotConfig,
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  const ctx = analyzeGame(player, gameState);
  const memory = getBotMemory(botConfig.id);
  const rand = Math.random();

  // ---- PRE-FLOP ----
  if (ctx.phase === 'pre-flop') {
    return mediumPreFlop(ctx, validActions, minBet, maxBet, gameState, memory, rand);
  }

  // ---- POST-FLOP ----

  // C-bet: if we raised pre-flop, bet 50-65% pot on flop
  if (ctx.phase === 'flop' && memory.wasPreFlopRaiser && !ctx.isRaised) {
    if (validActions.includes('raise') && rand < 0.7) {
      memory.wasPreFlopRaiser = false; // only c-bet once
      return { action: 'raise', amount: sizeBet(ctx.potSize, 0.5 + rand * 0.15, minBet, maxBet) };
    }
  }

  // Strong hand (65+): value bet
  if (ctx.handStrength >= 65) {
    if (validActions.includes('raise') && rand < 0.6) {
      const sizing = ctx.handStrength >= 80 ? 0.7 : 0.55;
      return { action: 'raise', amount: sizeBet(ctx.potSize, sizing, minBet, maxBet) };
    }
    if (validActions.includes('call')) return { action: 'call' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Medium hand (40-64): pot control
  if (ctx.handStrength >= 40) {
    if (validActions.includes('check')) return { action: 'check' };
    if (validActions.includes('call')) {
      // Call if getting good odds
      if (ctx.potOdds < 0.3) return { action: 'call' };
      // Fold to big bets with medium hands
      if (ctx.facingBigBet) return { action: 'fold' };
      if (rand < 0.5) return { action: 'call' };
      return { action: 'fold' };
    }
  }

  // Weak hand: check or fold
  if (validActions.includes('check')) return { action: 'check' };
  // Occasionally call small bets
  if (validActions.includes('call') && ctx.potOdds < 0.15 && rand < 0.2) {
    return { action: 'call' };
  }
  return { action: 'fold' };
}

function mediumPreFlop(
  ctx: GameContext, validActions: PlayerAction[], minBet: number, maxBet: number,
  gameState: GameState, memory: BotMemory, rand: number
): PlayerActionRequest {
  const score = ctx.preFlopScore;

  // Premium (80+): always raise/re-raise
  if (score >= 80) {
    if (validActions.includes('raise')) {
      memory.wasPreFlopRaiser = true;
      const sizing = ctx.isRaised ? 3 : 2.5;
      return { action: 'raise', amount: sizeBet(gameState.bigBlindAmount * sizing, 1, minBet, maxBet) };
    }
    if (validActions.includes('call')) return { action: 'call' };
  }

  // Strong (60-79): raise in position, call out of position
  if (score >= 60) {
    if (ctx.position > 0.5 && validActions.includes('raise') && !ctx.isRaised) {
      memory.wasPreFlopRaiser = true;
      return { action: 'raise', amount: sizeBet(gameState.bigBlindAmount * 2.5, 1, minBet, maxBet) };
    }
    if (validActions.includes('call')) return { action: 'call' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Playable (40-59): play in late position, limp/fold in early
  if (score >= 40) {
    if (ctx.position > 0.6 && !ctx.isRaised) {
      if (validActions.includes('raise') && rand < 0.35) {
        memory.wasPreFlopRaiser = true;
        return { action: 'raise', amount: sizeBet(gameState.bigBlindAmount * 2.2, 1, minBet, maxBet) };
      }
      if (validActions.includes('call') && ctx.toCall <= gameState.bigBlindAmount) {
        return { action: 'call' };
      }
    }
    if (validActions.includes('check')) return { action: 'check' };
    // Call cheap in BB
    if (validActions.includes('call') && ctx.toCall <= gameState.bigBlindAmount && rand < 0.5) {
      return { action: 'call' };
    }
    return { action: 'fold' };
  }

  // Junk: fold (pros fold a LOT pre-flop)
  if (validActions.includes('check')) return { action: 'check' };
  return { action: 'fold' };
}

// ==========================================
// Hard Bot — GTO-inspired professional
// Uses hand ranges, pot odds vs equity,
// c-bets, check-raises, bluffs, exploits
// ==========================================

function getHardAction(
  botConfig: BotConfig,
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  const ctx = analyzeGame(player, gameState);
  const memory = getBotMemory(botConfig.id);
  const rand = Math.random();

  // Opponent reads
  const opponentFoldsOften = memory.playerFoldRate > 0.45;
  const opponentIsPassive = memory.playerCallRate > 0.45 && memory.playerRaiseRate < 0.15;
  const opponentIsAggressive = memory.playerRaiseRate > 0.35;

  // ---- PRE-FLOP ----
  if (ctx.phase === 'pre-flop') {
    return hardPreFlop(ctx, validActions, minBet, maxBet, gameState, memory, rand, opponentFoldsOften);
  }

  // ---- POST-FLOP ----
  return hardPostFlop(ctx, validActions, minBet, maxBet, memory, rand, opponentFoldsOften, opponentIsPassive, opponentIsAggressive);
}

function hardPreFlop(
  ctx: GameContext, validActions: PlayerAction[], minBet: number, maxBet: number,
  gameState: GameState, memory: BotMemory, rand: number, opponentFoldsOften: boolean
): PlayerActionRequest {
  const score = ctx.preFlopScore;
  const bb = gameState.bigBlindAmount;

  // Premium (85+): 3-bet or raise always
  if (score >= 85) {
    if (validActions.includes('raise')) {
      memory.wasPreFlopRaiser = true;
      const sizing = ctx.isRaised ? ctx.highestBet * 3 : bb * 3;
      return { action: 'raise', amount: sizeBet(sizing, 1, minBet, maxBet) };
    }
    if (validActions.includes('call')) return { action: 'call' };
  }

  // Strong (65-84): raise first in, call 3-bets with top of range
  if (score >= 65) {
    if (!ctx.isRaised && validActions.includes('raise')) {
      memory.wasPreFlopRaiser = true;
      // Open raise 2.2-2.8x depending on position
      const openSize = bb * (2.2 + ctx.position * 0.6);
      return { action: 'raise', amount: sizeBet(openSize, 1, minBet, maxBet) };
    }
    if (ctx.isRaised) {
      // Call a single raise, fold to 3-bet with lower range
      if (score >= 75 && validActions.includes('raise') && rand < 0.3) {
        memory.wasPreFlopRaiser = true;
        return { action: 'raise', amount: sizeBet(ctx.highestBet * 2.8, 1, minBet, maxBet) };
      }
      if (validActions.includes('call') && ctx.toCall <= bb * 6) return { action: 'call' };
      if (validActions.includes('call') && score >= 75) return { action: 'call' };
      return { action: 'fold' };
    }
    if (validActions.includes('call')) return { action: 'call' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Playable (45-64): position-dependent, steal attempts
  if (score >= 45) {
    // Late position steal
    if (ctx.position > 0.65 && !ctx.isRaised && validActions.includes('raise') && rand < 0.55) {
      memory.wasPreFlopRaiser = true;
      const stealSize = opponentFoldsOften ? bb * 2.2 : bb * 2.5;
      return { action: 'raise', amount: sizeBet(stealSize, 1, minBet, maxBet) };
    }
    // Middle position: tighter
    if (ctx.position > 0.4 && !ctx.isRaised && validActions.includes('raise') && rand < 0.25) {
      memory.wasPreFlopRaiser = true;
      return { action: 'raise', amount: sizeBet(bb * 2.5, 1, minBet, maxBet) };
    }
    if (validActions.includes('check')) return { action: 'check' };
    // Call cheap with speculative hands (suited connectors, small pairs)
    if (validActions.includes('call') && ctx.toCall <= bb * 2 && score >= 50) return { action: 'call' };
    return { action: 'fold' };
  }

  // Speculative (30-44): only play for free or very cheap in position
  if (score >= 30) {
    if (validActions.includes('check')) return { action: 'check' };
    if (validActions.includes('call') && ctx.toCall <= bb && ctx.position > 0.6 && rand < 0.3) {
      return { action: 'call' };
    }
    return { action: 'fold' };
  }

  // Trash: fold (this is what pros actually do — fold 70%+ of hands)
  if (validActions.includes('check')) return { action: 'check' };
  return { action: 'fold' };
}

function hardPostFlop(
  ctx: GameContext, validActions: PlayerAction[], minBet: number, maxBet: number,
  memory: BotMemory, rand: number,
  oppFolds: boolean, oppPassive: boolean, oppAggressive: boolean
): PlayerActionRequest {
  const strength = ctx.handStrength;
  const board = ctx.board;

  // === MONSTER (85+) ===
  // Trap on dry boards, fast-play on wet boards
  if (strength >= 85) {
    if (board.isDry && validActions.includes('check') && rand < 0.35) {
      // Check-raise trap
      return { action: 'check' };
    }
    if (validActions.includes('raise')) {
      // Big value bet on wet boards (75-100% pot)
      const sizing = board.isWet ? 0.75 + rand * 0.25 : 0.55 + rand * 0.2;
      return { action: 'raise', amount: sizeBet(ctx.potSize, sizing, minBet, maxBet) };
    }
    // If facing a bet with a monster, raise if possible
    if (validActions.includes('raise') && ctx.isRaised) {
      return { action: 'raise', amount: sizeBet(ctx.potSize, 0.8, minBet, maxBet) };
    }
    if (validActions.includes('call')) return { action: 'call' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // === STRONG (65-84) ===
  // Value bet, call raises, occasional check-raise
  if (strength >= 65) {
    // C-bet on flop if we were the raiser
    if (ctx.phase === 'flop' && memory.wasPreFlopRaiser && !ctx.isRaised) {
      if (validActions.includes('raise')) {
        memory.wasPreFlopRaiser = false;
        return { action: 'raise', amount: sizeBet(ctx.potSize, 0.55 + rand * 0.15, minBet, maxBet) };
      }
    }

    // Check-raise with very strong hands
    if (validActions.includes('check') && strength >= 75 && rand < 0.2 && !oppPassive) {
      return { action: 'check' }; // planning to raise if opponent bets
    }

    // Value bet
    if (validActions.includes('raise') && !ctx.isRaised) {
      const sizing = strength >= 75 ? 0.6 + rand * 0.15 : 0.45 + rand * 0.15;
      return { action: 'raise', amount: sizeBet(ctx.potSize, sizing, minBet, maxBet) };
    }

    // Facing a bet: call, sometimes raise
    if (ctx.isRaised) {
      if (validActions.includes('raise') && strength >= 75 && rand < 0.25) {
        return { action: 'raise', amount: sizeBet(ctx.potSize, 0.7, minBet, maxBet) };
      }
      if (validActions.includes('call')) return { action: 'call' };
    }

    if (validActions.includes('check')) return { action: 'check' };
    if (validActions.includes('call')) return { action: 'call' };
  }

  // === MEDIUM (40-64) ===
  // Pot control, draw play, position-dependent
  if (strength >= 40) {
    // C-bet lighter on dry boards
    if (ctx.phase === 'flop' && memory.wasPreFlopRaiser && !ctx.isRaised && board.isDry) {
      if (validActions.includes('raise') && rand < 0.5) {
        memory.wasPreFlopRaiser = false;
        return { action: 'raise', amount: sizeBet(ctx.potSize, 0.33 + rand * 0.15, minBet, maxBet) };
      }
    }

    // Check for pot control
    if (validActions.includes('check')) return { action: 'check' };

    // Facing a bet
    if (validActions.includes('call')) {
      // Good pot odds: call
      if (ctx.potOdds < 0.25) return { action: 'call' };
      // Drawing hand on wet board: call
      if (board.isWet && strength >= 50 && ctx.potOdds < 0.35) return { action: 'call' };
      // Don't call big bets with medium hands
      if (ctx.facingBigBet) return { action: 'fold' };
      // Marginal call
      if (rand < 0.4) return { action: 'call' };
      return { action: 'fold' };
    }
  }

  // === WEAK / DRAWS (20-39) ===
  if (strength >= 20) {
    // Semi-bluff with draws on wet boards
    if (board.isWet && validActions.includes('raise') && !ctx.isRaised && rand < 0.25) {
      return { action: 'raise', amount: sizeBet(ctx.potSize, 0.5, minBet, maxBet) };
    }

    if (validActions.includes('check')) return { action: 'check' };

    // Call with draws if getting good odds
    if (validActions.includes('call') && ctx.potOdds < 0.2 && board.isWet) {
      return { action: 'call' };
    }

    return { action: 'fold' };
  }

  // === AIR (0-19) ===
  // Pure bluff situations
  if (validActions.includes('check')) {
    // Bluff on river if opponent folds a lot and board is scary
    if (ctx.phase === 'river' && oppFolds && board.isScary && validActions.includes('raise') && rand < 0.2) {
      return { action: 'raise', amount: sizeBet(ctx.potSize, 0.65, minBet, maxBet) };
    }
    return { action: 'check' };
  }

  // Don't call with air
  return { action: 'fold' };
}
