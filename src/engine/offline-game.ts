// ==========================================
// PokerZone - Offline Game Manager
// ==========================================
// Manages a full poker game locally without a server,
// coordinating bot players with delayed actions for
// a natural gameplay feel.

import {
  GameState,
  GameVariant,
  Player,
  PlayerAction,
  PlayerActionRequest,
  RoomConfig,
  HandRecord,
} from './types';
import { PokerGame } from './poker-game';
import { BotConfig, BotDifficulty, createBot, getBotAction, updateBotMemory, clearBotMemories } from './bot';

// ==========================================
// Types
// ==========================================

export interface OfflineGameCallbacks {
  /** Called whenever the game state changes */
  onStateChange?: (state: GameState) => void;
  /** Called when a bot takes an action, includes the bot's identity and chosen action */
  onBotAction?: (botId: string, botName: string, action: PlayerActionRequest) => void;
  /** Called when a hand completes, includes the hand record */
  onHandComplete?: (record: HandRecord) => void;
  /** Called when it is the human player's turn to act */
  onPlayerTurnStart?: (validActions: PlayerAction[], minBet: number, maxBet: number) => void;
  /** Called when the game encounters an error */
  onError?: (message: string) => void;
  /** Called when the game starts */
  onGameStart?: (state: GameState) => void;
}

export interface OfflineGameConfig {
  /** The human player's display name */
  playerName: string;
  /** The human player's avatar */
  playerAvatar: string;
  /** Number of bot opponents (1-8) */
  numberOfBots: number;
  /** Difficulty level for all bots */
  botDifficulty: BotDifficulty;
  /** Starting chip count for all players */
  startingChips: number;
  /** Small blind amount */
  smallBlind: number;
  /** Big blind amount */
  bigBlind: number;
  /** Game variant (defaults to texas-holdem) */
  variant?: GameVariant;
  /** Ante amount (optional, defaults to 0) */
  ante?: number;
  /** Delay range for bot actions in ms: [min, max] */
  botDelayRange?: [number, number];
  /** Whether to auto-start new hands after a hand finishes */
  autoStartNextHand?: boolean;
  /** Delay before starting the next hand in ms */
  nextHandDelay?: number;
}

// ==========================================
// Constants
// ==========================================

const HUMAN_PLAYER_ID = 'human-player';
const DEFAULT_BOT_DELAY_MIN = 500;
const DEFAULT_BOT_DELAY_MAX = 1500;
const DEFAULT_NEXT_HAND_DELAY = 2500;

// ==========================================
// Offline Game Manager
// ==========================================

export class OfflineGameManager {
  private game: PokerGame;
  private config: OfflineGameConfig;
  private roomConfig: RoomConfig;
  private bots: Map<string, BotConfig> = new Map();
  private callbacks: OfflineGameCallbacks;
  private botTimers: ReturnType<typeof setTimeout>[] = [];
  private nextHandTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;
  private isProcessingBot = false;
  private humanPlayerId: string = HUMAN_PLAYER_ID;

  constructor(config: OfflineGameConfig, callbacks: OfflineGameCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;

    // Build the RoomConfig for the underlying PokerGame
    const maxPlayers = Math.min(config.numberOfBots + 1, 9);
    this.roomConfig = {
      name: 'Offline Game',
      variant: config.variant ?? 'texas-holdem',
      bettingStructure: 'no-limit',
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      ante: config.ante ?? 0,
      minBuyIn: config.startingChips,
      maxBuyIn: config.startingChips,
      maxPlayers,
      turnTimeLimit: 60,
      autoStart: true,
      isPrivate: true,
      allowStraddle: false,
      runItTwice: false,
    };

    this.game = new PokerGame(this.roomConfig);

    // Create and register bots
    this.setupBots();

    // Add the human player
    this.addHumanPlayer();
  }

  // ==========================================
  // Setup
  // ==========================================

  private setupBots(): void {
    const numBots = Math.min(this.config.numberOfBots, 8);
    for (let i = 0; i < numBots; i++) {
      const bot = createBot(this.config.botDifficulty, i);
      this.bots.set(bot.id, bot);
      this.game.addPlayer(
        bot.id,
        bot.name,
        bot.avatar,
        this.config.startingChips,
        i + 1 // Seat indices 1..N for bots, 0 for human
      );
    }
  }

  private addHumanPlayer(): void {
    this.game.addPlayer(
      this.humanPlayerId,
      this.config.playerName,
      this.config.playerAvatar,
      this.config.startingChips,
      0 // Human always sits at seat 0
    );
  }

  // ==========================================
  // Public API
  // ==========================================

  /**
   * Starts the game by dealing the first hand.
   * Emits onGameStart and onStateChange callbacks.
   */
  startGame(): void {
    if (this.isDestroyed) return;

    const started = this.game.startHand();
    if (!started) {
      this.callbacks.onError?.('Unable to start hand — not enough players.');
      return;
    }

    const state = this.game.getState();
    this.callbacks.onGameStart?.(state);
    this.emitStateChange();
    this.processCurrentTurn();
  }

  /**
   * Processes an action from the human player.
   * After the human acts, continues the game loop for bot turns.
   */
  processPlayerAction(action: PlayerActionRequest): boolean {
    if (this.isDestroyed) return false;

    const state = this.game.getState();
    const currentPlayerId = this.game.getCurrentPlayerId();

    if (currentPlayerId !== this.humanPlayerId) {
      this.callbacks.onError?.('It is not your turn.');
      return false;
    }

    const success = this.game.processAction(this.humanPlayerId, action);
    if (!success) {
      this.callbacks.onError?.('Invalid action.');
      return false;
    }

    // Update bot memories about the human player's tendencies
    for (const [botId] of this.bots) {
      updateBotMemory(botId, action.action);
    }

    this.emitStateChange();

    // Check if hand is complete
    const newState = this.game.getState();
    if (newState.phase === 'finished' || newState.phase === 'showdown') {
      this.handleHandComplete();
      return true;
    }

    // Continue game loop for next player
    this.processCurrentTurn();
    return true;
  }

  /**
   * Returns the current game state, with bot cards hidden.
   */
  getState(): GameState {
    return this.game.getStateForPlayer(this.humanPlayerId);
  }

  /**
   * Returns the full game state (including bot cards). Useful for showdown display.
   */
  getFullState(): GameState {
    return this.game.getState();
  }

  /**
   * Adds chips to the human player's stack (e.g., rebuy).
   */
  addChips(amount: number): boolean {
    if (this.isDestroyed) return false;
    // Temporarily raise maxBuyIn to allow rebuy
    const success = this.game.addChips(this.humanPlayerId, amount);
    if (success) {
      this.emitStateChange();
    }
    return success;
  }

  /**
   * Returns the hand history for all completed hands.
   */
  getHandHistory(): HandRecord[] {
    return this.game.getHandHistory();
  }

  /**
   * Returns the bot configurations.
   */
  getBots(): BotConfig[] {
    return Array.from(this.bots.values());
  }

  /**
   * Returns the human player's ID.
   */
  getHumanPlayerId(): string {
    return this.humanPlayerId;
  }

  /**
   * Starts a new hand. Can be called manually if autoStartNextHand is false.
   */
  startNextHand(): void {
    if (this.isDestroyed) return;

    // Remove busted bots
    const state = this.game.getState();
    for (const player of state.players) {
      if (player.chips <= 0 && player.id !== this.humanPlayerId) {
        this.game.removePlayer(player.id);
        this.bots.delete(player.id);
      }
    }

    if (!this.game.canStartHand()) {
      this.callbacks.onError?.('Not enough players to continue. Game over!');
      return;
    }

    const started = this.game.startHand();
    if (!started) {
      this.callbacks.onError?.('Unable to start next hand.');
      return;
    }

    this.emitStateChange();
    this.processCurrentTurn();
  }

  /**
   * Cleans up all timers and marks the manager as destroyed.
   */
  destroy(): void {
    this.isDestroyed = true;
    this.clearAllTimers();
    clearBotMemories();
  }

  // ==========================================
  // Game Loop
  // ==========================================

  private processCurrentTurn(): void {
    if (this.isDestroyed) return;

    const state = this.game.getState();
    if (state.phase === 'finished' || state.phase === 'showdown') {
      this.handleHandComplete();
      return;
    }

    const currentPlayerId = this.game.getCurrentPlayerId();
    if (!currentPlayerId) return;

    if (currentPlayerId === this.humanPlayerId) {
      // It's the human's turn — notify via callback
      const validActions = this.game.getValidActions(this.humanPlayerId);
      this.callbacks.onPlayerTurnStart?.(
        validActions.actions,
        validActions.minBet,
        validActions.maxBet
      );
    } else if (this.bots.has(currentPlayerId)) {
      // It's a bot's turn — process with delay
      this.scheduleBotAction(currentPlayerId);
    }
  }

  private scheduleBotAction(botId: string): void {
    if (this.isDestroyed || this.isProcessingBot) return;

    this.isProcessingBot = true;

    const [delayMin, delayMax] = this.config.botDelayRange ?? [DEFAULT_BOT_DELAY_MIN, DEFAULT_BOT_DELAY_MAX];
    const delay = delayMin + Math.floor(Math.random() * (delayMax - delayMin));

    const timer = setTimeout(() => {
      if (this.isDestroyed) {
        this.isProcessingBot = false;
        return;
      }

      this.executeBotAction(botId);
      this.isProcessingBot = false;
    }, delay);

    this.botTimers.push(timer);
  }

  private executeBotAction(botId: string): void {
    if (this.isDestroyed) return;

    const botConfig = this.bots.get(botId);
    if (!botConfig) return;

    // Verify it's still this bot's turn (state may have changed)
    const currentPlayerId = this.game.getCurrentPlayerId();
    if (currentPlayerId !== botId) return;

    const state = this.game.getState();
    const player = state.players.find(p => p.id === botId);
    if (!player) return;

    const validActions = this.game.getValidActions(botId);
    if (validActions.actions.length === 0) return;

    // Get the bot's decision
    const action = getBotAction(
      botConfig,
      player,
      state,
      validActions.actions,
      validActions.minBet,
      validActions.maxBet
    );

    // Execute the action
    const success = this.game.processAction(botId, action);
    if (!success) {
      // Fallback: fold or check
      const fallback: PlayerActionRequest = validActions.actions.includes('check')
        ? { action: 'check' }
        : { action: 'fold' };
      this.game.processAction(botId, fallback);
      this.callbacks.onBotAction?.(botId, botConfig.name, fallback);
    } else {
      this.callbacks.onBotAction?.(botId, botConfig.name, action);
    }

    this.emitStateChange();

    // Check if hand is done
    const newState = this.game.getState();
    if (newState.phase === 'finished' || newState.phase === 'showdown') {
      this.handleHandComplete();
      return;
    }

    // Continue to next player
    this.processCurrentTurn();
  }

  // ==========================================
  // Hand Completion
  // ==========================================

  private handleHandComplete(): void {
    if (this.isDestroyed) return;

    const lastHand = this.game.getLastHand();
    if (lastHand) {
      this.callbacks.onHandComplete?.(lastHand);
    }

    this.emitStateChange();

    // Auto-start next hand if configured
    const autoStart = this.config.autoStartNextHand ?? true;
    if (autoStart) {
      const nextHandDelay = this.config.nextHandDelay ?? DEFAULT_NEXT_HAND_DELAY;
      this.nextHandTimer = setTimeout(() => {
        if (!this.isDestroyed) {
          this.startNextHand();
        }
      }, nextHandDelay);
    }
  }

  // ==========================================
  // Helpers
  // ==========================================

  private emitStateChange(): void {
    if (this.isDestroyed) return;
    // Send the player-facing state (bot cards hidden except at showdown)
    const state = this.game.getStateForPlayer(this.humanPlayerId);
    this.callbacks.onStateChange?.(state);
  }

  private clearAllTimers(): void {
    for (const timer of this.botTimers) {
      clearTimeout(timer);
    }
    this.botTimers = [];

    if (this.nextHandTimer !== null) {
      clearTimeout(this.nextHandTimer);
      this.nextHandTimer = null;
    }
  }
}
