// ==========================================
// PokerZone - AI Bot Engine
// ==========================================
// Provides AI opponents with multiple difficulty levels
// for offline poker play.

import {
  Card,
  GameState,
  GamePhase,
  Player,
  PlayerAction,
  PlayerActionRequest,
  GameVariant,
} from './types';
import { evaluateHand, getHandStrength } from './hand-evaluator';

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

// Internal tracking for the hard bot's tendency adjustments
export interface BotMemory {
  handsPlayed: number;
  playerFoldRate: number;
  playerRaiseRate: number;
  playerCallRate: number;
  totalPlayerActions: number;
}

// ==========================================
// Bot Names & Personalities
// ==========================================

const BOT_PROFILES: { name: string; avatar: string; personality: string }[] = [
  { name: 'BluffBot', avatar: '🤖', personality: 'Loves to bluff and keep you guessing' },
  { name: 'FoldMaster', avatar: '🃏', personality: 'Patience is a virtue... or an excuse to fold' },
  { name: 'RiverRat', avatar: '🐀', personality: 'Always catches that miracle river card' },
  { name: 'NitNancy', avatar: '🔒', personality: 'Tighter than a drum, only plays the nuts' },
  { name: 'AgroAndy', avatar: '🔥', personality: 'Aggression is the only language he speaks' },
  { name: 'CallingStation', avatar: '📞', personality: 'Will call you down with bottom pair' },
  { name: 'TightTony', avatar: '🎩', personality: 'Plays premium hands and premium hands only' },
  { name: 'LooseLouis', avatar: '🎰', personality: 'Any two cards can win, right?' },
  { name: 'SharkyAI', avatar: '🦈', personality: 'Smells blood in the water from miles away' },
  { name: 'TheGrinder', avatar: '⚙️', personality: 'Slow and steady wins the chip stack' },
  { name: 'LuckyLucy', avatar: '🍀', personality: 'Fortune favors the bold... and Lucy' },
  { name: 'MathBot', avatar: '🧮', personality: 'Calculates every pot odd to the decimal' },
  { name: 'WildCard', avatar: '🃁', personality: 'Unpredictable and proud of it' },
  { name: 'IceCold', avatar: '🧊', personality: 'Never tilts, never shows emotion' },
  { name: 'PhilTheThrill', avatar: '😎', personality: 'Thinks every hand is a TV final table' },
];

// ==========================================
// Bot Creation
// ==========================================

/**
 * Creates a bot configuration with a fun poker-themed identity.
 * @param difficulty - The difficulty level of the bot
 * @param index - Index used to select a unique profile (wraps around)
 * @returns A BotConfig ready to be added to a game
 */
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
// Bot Memory (for hard bots)
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
    });
  }
  return botMemories.get(botId)!;
}

export function updateBotMemory(botId: string, playerAction: PlayerAction): void {
  const memory = getBotMemory(botId);
  memory.totalPlayerActions++;
  const n = memory.totalPlayerActions;

  // Running average update
  if (playerAction === 'fold') {
    memory.playerFoldRate = memory.playerFoldRate + (1 - memory.playerFoldRate) / n;
    memory.playerRaiseRate = memory.playerRaiseRate + (0 - memory.playerRaiseRate) / n;
    memory.playerCallRate = memory.playerCallRate + (0 - memory.playerCallRate) / n;
  } else if (playerAction === 'raise' || playerAction === 'bet') {
    memory.playerFoldRate = memory.playerFoldRate + (0 - memory.playerFoldRate) / n;
    memory.playerRaiseRate = memory.playerRaiseRate + (1 - memory.playerRaiseRate) / n;
    memory.playerCallRate = memory.playerCallRate + (0 - memory.playerCallRate) / n;
  } else if (playerAction === 'call') {
    memory.playerFoldRate = memory.playerFoldRate + (0 - memory.playerFoldRate) / n;
    memory.playerRaiseRate = memory.playerRaiseRate + (0 - memory.playerRaiseRate) / n;
    memory.playerCallRate = memory.playerCallRate + (1 - memory.playerCallRate) / n;
  }
}

export function clearBotMemories(): void {
  botMemories.clear();
}

// ==========================================
// Bot Decision Engine
// ==========================================

/**
 * Determines the action a bot should take given the current game state.
 *
 * @param botConfig - The bot's configuration (difficulty, personality, etc.)
 * @param player - The bot's Player object from the game state
 * @param gameState - The current full game state
 * @param validActions - Array of actions the bot is allowed to take
 * @param minBet - Minimum bet/raise amount
 * @param maxBet - Maximum bet/raise amount
 * @returns A PlayerActionRequest describing the chosen action and optional amount
 */
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
      return getEasyBotAction(player, gameState, validActions, minBet, maxBet);
    case 'medium':
      return getMediumBotAction(player, gameState, validActions, minBet, maxBet);
    case 'hard':
      return getHardBotAction(botConfig, player, gameState, validActions, minBet, maxBet);
    default:
      return getEasyBotAction(player, gameState, validActions, minBet, maxBet);
  }
}

// ==========================================
// Easy Bot - Random play, prefers checking/calling
// ==========================================

function getEasyBotAction(
  _player: Player,
  _gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  const rand = Math.random();

  // Strong preference for passive play
  if (validActions.includes('check') && rand < 0.6) {
    return { action: 'check' };
  }

  if (validActions.includes('call') && rand < 0.7) {
    return { action: 'call' };
  }

  // Occasionally raise (15% of the time)
  if (validActions.includes('raise') && rand < 0.15) {
    // Small raise — usually min bet or slightly above
    const raiseAmount = Math.min(
      minBet + Math.floor(Math.random() * (minBet * 0.5)),
      maxBet
    );
    return { action: 'raise', amount: raiseAmount };
  }

  // Rarely go all-in (3% of the time)
  if (validActions.includes('all-in') && rand < 0.03) {
    return { action: 'all-in' };
  }

  // Default: check if possible, otherwise call, otherwise fold
  if (validActions.includes('check')) {
    return { action: 'check' };
  }
  if (validActions.includes('call')) {
    return { action: 'call' };
  }

  return { action: 'fold' };
}

// ==========================================
// Medium Bot - Hand-strength aware
// ==========================================

function getMediumBotAction(
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  const handStrength = getHandStrength(
    player.cards,
    gameState.communityCards,
    gameState.variant
  );

  const potSize = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const highestBet = Math.max(0, ...gameState.players.map(p => p.currentBet));
  const toCall = highestBet - player.currentBet;
  const potOdds = potSize > 0 ? toCall / (potSize + toCall) : 0;

  // Pre-flop with no community cards: use simpler heuristics
  const isPreFlop = gameState.phase === 'pre-flop';

  // Hand strength thresholds
  const isStrong = handStrength >= 70;
  const isMedium = handStrength >= 40 && handStrength < 70;
  const isWeak = handStrength < 40;

  const rand = Math.random();

  // Strong hand: bet/raise, but sometimes just call to avoid infinite raise wars
  if (isStrong) {
    if (validActions.includes('raise') && rand < 0.55) {
      // Bet between 50%-80% of pot
      const betSize = Math.max(
        minBet,
        Math.min(
          Math.floor(potSize * (0.5 + Math.random() * 0.3)),
          maxBet
        )
      );
      return { action: 'raise', amount: betSize };
    }
    if (validActions.includes('call')) {
      return { action: 'call' };
    }
    if (validActions.includes('check')) {
      return { action: 'check' };
    }
  }

  // Medium hand: play cautiously, consider pot odds
  if (isMedium) {
    if (validActions.includes('check')) {
      // Sometimes bet for value with medium hands
      if (validActions.includes('raise') && rand < 0.25) {
        const betSize = Math.max(minBet, Math.min(Math.floor(potSize * 0.4), maxBet));
        return { action: 'raise', amount: betSize };
      }
      return { action: 'check' };
    }
    if (validActions.includes('call')) {
      // Call if pot odds are favorable
      if (potOdds < 0.35 || rand < 0.5) {
        return { action: 'call' };
      }
      return { action: 'fold' };
    }
  }

  // Weak hand: mostly fold, sometimes bluff
  if (isWeak) {
    if (validActions.includes('check')) {
      return { action: 'check' };
    }
    // Fold to bets most of the time
    if (validActions.includes('call') && rand < 0.15) {
      return { action: 'call' };
    }

    // Pre-flop: slightly more willing to see a flop cheaply
    if (isPreFlop && validActions.includes('call') && toCall <= gameState.bigBlindAmount && rand < 0.4) {
      return { action: 'call' };
    }

    return { action: 'fold' };
  }

  // Fallback
  if (validActions.includes('check')) return { action: 'check' };
  if (validActions.includes('call')) return { action: 'call' };
  return { action: 'fold' };
}

// ==========================================
// Hard Bot - Advanced strategy
// ==========================================

function getHardBotAction(
  botConfig: BotConfig,
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number
): PlayerActionRequest {
  const handStrength = getHandStrength(
    player.cards,
    gameState.communityCards,
    gameState.variant
  );

  const potSize = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const highestBet = Math.max(0, ...gameState.players.map(p => p.currentBet));
  const toCall = highestBet - player.currentBet;
  const potOdds = potSize > 0 ? toCall / (potSize + toCall) : 0;
  const activePlayers = gameState.players.filter(p => !p.isFolded && !p.isSittingOut);
  const numOpponents = activePlayers.length - 1;

  const memory = getBotMemory(botConfig.id);
  const phase = gameState.phase;
  const rand = Math.random();

  // Position analysis: being later to act is an advantage
  const playerIdx = gameState.players.indexOf(player);
  const dealerIdx = gameState.dealerIndex;
  const totalActive = activePlayers.length;
  const positionScore = getPositionScore(playerIdx, dealerIdx, gameState.players.length, totalActive);

  // Board texture analysis
  const boardTexture = analyzeBoardTexture(gameState.communityCards);

  // Adjusted hand strength: factor in position and number of opponents
  // More opponents = need stronger hand; better position = slight bonus
  const positionBonus = positionScore * 5; // 0-5 points
  const opponentPenalty = Math.max(0, (numOpponents - 1) * 3); // 3 points per extra opponent
  const adjustedStrength = Math.min(100, Math.max(0, handStrength + positionBonus - opponentPenalty));

  // Exploit player tendencies
  const playerIsPassive = memory.playerCallRate > 0.5 && memory.playerRaiseRate < 0.15;
  const playerIsAggressive = memory.playerRaiseRate > 0.35;
  const playerFoldsOften = memory.playerFoldRate > 0.45;

  // ---- PRE-FLOP STRATEGY ----
  if (phase === 'pre-flop') {
    return getHardPreFlopAction(
      player, gameState, validActions, minBet, maxBet,
      adjustedStrength, positionScore, playerFoldsOften, playerIsPassive
    );
  }

  // ---- POST-FLOP STRATEGY ----

  // Monster hand (80+): slow play or value bet
  if (adjustedStrength >= 80) {
    // Slow play on dry boards occasionally
    if (boardTexture.isDry && rand < 0.25 && validActions.includes('check')) {
      return { action: 'check' };
    }
    // Value bet: 60-100% of pot
    if (validActions.includes('raise')) {
      const betSize = Math.max(
        minBet,
        Math.min(Math.floor(potSize * (0.6 + Math.random() * 0.4)), maxBet)
      );
      return { action: 'raise', amount: betSize };
    }
    if (validActions.includes('call')) {
      return { action: 'call' };
    }
    if (validActions.includes('check')) {
      return { action: 'check' };
    }
  }

  // Strong hand (60-79): bet for value, call raises
  if (adjustedStrength >= 60) {
    if (validActions.includes('check') && validActions.includes('raise')) {
      // Bet most of the time
      if (rand < 0.75) {
        const betSize = Math.max(
          minBet,
          Math.min(Math.floor(potSize * (0.5 + Math.random() * 0.25)), maxBet)
        );
        return { action: 'raise', amount: betSize };
      }
      return { action: 'check' };
    }
    if (validActions.includes('call')) {
      // Call if pot odds are reasonable
      if (potOdds < 0.4) {
        return { action: 'call' };
      }
      // Might re-raise with a very strong read
      if (validActions.includes('raise') && rand < 0.3) {
        const betSize = Math.max(minBet, Math.min(Math.floor(potSize * 0.7), maxBet));
        return { action: 'raise', amount: betSize };
      }
      return { action: 'call' };
    }
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Medium hand (40-59): pot control, consider draws
  if (adjustedStrength >= 40) {
    if (validActions.includes('check')) {
      // Semi-bluff on wet boards
      if (boardTexture.isWet && validActions.includes('raise') && rand < 0.3) {
        const betSize = Math.max(minBet, Math.min(Math.floor(potSize * 0.4), maxBet));
        return { action: 'raise', amount: betSize };
      }
      return { action: 'check' };
    }
    if (validActions.includes('call')) {
      // Call with decent pot odds
      if (potOdds < 0.3) {
        return { action: 'call' };
      }
      // Against passive opponents, more willing to call
      if (playerIsPassive && potOdds < 0.4) {
        return { action: 'call' };
      }
      return { action: 'fold' };
    }
  }

  // Weak hand (below 40): mostly fold, occasional bluff
  if (adjustedStrength < 40) {
    if (validActions.includes('check')) {
      // Bluff on scary boards against players who fold often
      const bluffChance = playerFoldsOften ? 0.25 : 0.1;
      if (validActions.includes('raise') && rand < bluffChance && boardTexture.isScary) {
        const betSize = Math.max(
          minBet,
          Math.min(Math.floor(potSize * (0.6 + Math.random() * 0.2)), maxBet)
        );
        return { action: 'raise', amount: betSize };
      }
      return { action: 'check' };
    }

    // Bluff-catch against aggressive opponents
    if (validActions.includes('call') && playerIsAggressive && potOdds < 0.25 && rand < 0.2) {
      return { action: 'call' };
    }

    return { action: 'fold' };
  }

  // Final fallback
  if (validActions.includes('check')) return { action: 'check' };
  if (validActions.includes('fold')) return { action: 'fold' };
  return { action: validActions[0] };
}

// ==========================================
// Hard Bot: Pre-Flop Sub-Strategy
// ==========================================

function getHardPreFlopAction(
  player: Player,
  gameState: GameState,
  validActions: PlayerAction[],
  minBet: number,
  maxBet: number,
  adjustedStrength: number,
  positionScore: number,
  playerFoldsOften: boolean,
  _playerIsPassive: boolean
): PlayerActionRequest {
  const potSize = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
  const highestBet = Math.max(0, ...gameState.players.map(p => p.currentBet));
  const toCall = highestBet - player.currentBet;
  const rand = Math.random();

  // Premium hands (70+): raise or re-raise
  if (adjustedStrength >= 70) {
    if (validActions.includes('raise')) {
      // Standard open: 2.5-3.5x BB
      const multiplier = 2.5 + Math.random();
      const raiseAmount = Math.max(
        minBet,
        Math.min(Math.floor(gameState.bigBlindAmount * multiplier), maxBet)
      );
      return { action: 'raise', amount: raiseAmount };
    }
    if (validActions.includes('call')) return { action: 'call' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Good hands (50-69): raise in position, call out of position
  if (adjustedStrength >= 50) {
    if (positionScore > 0.6 && validActions.includes('raise') && rand < 0.6) {
      const raiseAmount = Math.max(
        minBet,
        Math.min(Math.floor(gameState.bigBlindAmount * 2.5), maxBet)
      );
      return { action: 'raise', amount: raiseAmount };
    }
    if (validActions.includes('call')) return { action: 'call' };
    if (validActions.includes('check')) return { action: 'check' };
  }

  // Marginal hands (30-49): play in position, steal blinds
  if (adjustedStrength >= 30) {
    // Late position steal attempt
    if (positionScore > 0.7 && playerFoldsOften && validActions.includes('raise') && rand < 0.4) {
      const raiseAmount = Math.max(
        minBet,
        Math.min(Math.floor(gameState.bigBlindAmount * 2.2), maxBet)
      );
      return { action: 'raise', amount: raiseAmount };
    }
    if (validActions.includes('check')) return { action: 'check' };
    // Call only if cheap
    if (validActions.includes('call') && toCall <= gameState.bigBlindAmount && rand < 0.5) {
      return { action: 'call' };
    }
    return { action: 'fold' };
  }

  // Junk hands (<30): fold unless free
  if (validActions.includes('check')) return { action: 'check' };
  return { action: 'fold' };
}

// ==========================================
// Board Texture Analysis
// ==========================================

interface BoardTexture {
  isDry: boolean;
  isWet: boolean;
  isScary: boolean;
  hasPairedBoard: boolean;
  hasFlushDraw: boolean;
  hasStraightDraw: boolean;
}

function analyzeBoardTexture(communityCards: Card[]): BoardTexture {
  if (communityCards.length === 0) {
    return {
      isDry: true,
      isWet: false,
      isScary: false,
      hasPairedBoard: false,
      hasFlushDraw: false,
      hasStraightDraw: false,
    };
  }

  // Check for paired board
  const rankCounts = new Map<string, number>();
  for (const card of communityCards) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  }
  const hasPairedBoard = Array.from(rankCounts.values()).some(c => c >= 2);

  // Check for flush draw potential (3+ of same suit)
  const suitCounts = new Map<string, number>();
  for (const card of communityCards) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  }
  const maxSuitCount = Math.max(0, ...Array.from(suitCounts.values()));
  const hasFlushDraw = maxSuitCount >= 3;

  // Check for straight draw potential (connected cards)
  const RANK_VALUES: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  const values = communityCards.map(c => RANK_VALUES[c.rank] || 0).sort((a, b) => a - b);
  let hasStraightDraw = false;
  if (values.length >= 3) {
    // Check if there are 3 cards within a 5-card span
    for (let i = 0; i < values.length - 2; i++) {
      if (values[i + 2] - values[i] <= 4) {
        hasStraightDraw = true;
        break;
      }
    }
  }

  const isWet = hasFlushDraw || hasStraightDraw;
  const isDry = !isWet && !hasPairedBoard;
  // Board is "scary" when there are many draws or high cards making big hands possible
  const highCardCount = communityCards.filter(c =>
    RANK_VALUES[c.rank] >= 10
  ).length;
  const isScary = isWet || hasPairedBoard || highCardCount >= 3;

  return { isDry, isWet, isScary, hasPairedBoard, hasFlushDraw, hasStraightDraw };
}

// ==========================================
// Position Analysis
// ==========================================

/**
 * Returns a score from 0 to 1 indicating how favorable the player's position is.
 * 1.0 = on the button (best), 0.0 = under the gun (worst).
 */
function getPositionScore(
  playerIdx: number,
  dealerIdx: number,
  totalPlayers: number,
  activePlayers: number
): number {
  if (activePlayers <= 1) return 0.5;

  // Calculate seats away from dealer going clockwise
  const seatsFromDealer = (playerIdx - dealerIdx + totalPlayers) % totalPlayers;

  // Normalize: 0 means right after dealer (early), high means close to or at dealer (late)
  // Dealer acts last post-flop, so being the dealer is best
  if (seatsFromDealer === 0) return 1.0; // On the button

  return seatsFromDealer / totalPlayers;
}
