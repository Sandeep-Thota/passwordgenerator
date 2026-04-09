// ==========================================
// PokerZone - Core Poker Game Engine
// ==========================================

import { Deck } from './deck';
import { evaluateHand, determineWinners } from './hand-evaluator';
import {
  Card, GameState, GamePhase, GameVariant, BettingStructure,
  Player, PlayerAction, PlayerActionRequest, Pot, HandResult,
  HandRecord, RoomConfig,
} from './types';

export class PokerGame {
  private state: GameState;
  private deck: Deck;
  private config: RoomConfig;
  private handHistory: HandRecord[] = [];
  private actionLog: HandRecord['actions'] = [];

  constructor(config: RoomConfig) {
    this.config = config;
    this.deck = new Deck(config.variant);
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      id: this.generateId(),
      variant: this.config.variant,
      bettingStructure: this.config.bettingStructure,
      phase: 'waiting',
      players: [],
      communityCards: [],
      pots: [{ amount: 0, eligiblePlayerIds: [] }],
      currentPlayerIndex: -1,
      dealerIndex: 0,
      smallBlindAmount: this.config.smallBlind,
      bigBlindAmount: this.config.bigBlind,
      ante: this.config.ante,
      minBet: this.config.bigBlind,
      maxBuyIn: this.config.maxBuyIn,
      minBuyIn: this.config.minBuyIn,
      turnTimeLimit: this.config.turnTimeLimit,
      turnStartTime: 0,
      handNumber: 0,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  getState(): GameState {
    return { ...this.state };
  }

  // Returns state with hidden cards for non-active players
  getStateForPlayer(playerId: string): GameState {
    const state = { ...this.state };
    state.players = state.players.map(p => {
      if (p.id === playerId) return { ...p };
      if (p.showCards || this.state.phase === 'showdown') return { ...p };
      return { ...p, cards: p.cards.map(() => ({ rank: '?' as any, suit: '?' as any, code: '??' })) };
    });
    return state;
  }

  addPlayer(id: string, name: string, avatar: string, chips: number, seatIndex: number): boolean {
    if (this.state.players.length >= this.config.maxPlayers) return false;
    if (this.state.players.find(p => p.seatIndex === seatIndex)) return false;
    if (this.state.players.find(p => p.id === id)) return false;
    if (chips < this.config.minBuyIn || chips > this.config.maxBuyIn) return false;

    const player: Player = {
      id,
      name,
      avatar,
      chips,
      seatIndex,
      cards: [],
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      isFolded: false,
      isAllIn: false,
      isSittingOut: false,
      isConnected: true,
      currentBet: 0,
      totalBetThisRound: 0,
      hasActed: false,
      showCards: false,
      timeBank: 30,
      winAmount: 0,
    };

    this.state.players.push(player);
    this.state.players.sort((a, b) => a.seatIndex - b.seatIndex);
    return true;
  }

  removePlayer(playerId: string): void {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    if (this.state.phase !== 'waiting' && this.state.phase !== 'finished') {
      // If game is in progress, mark as folded/sitting out
      this.state.players[playerIndex].isFolded = true;
      this.state.players[playerIndex].isSittingOut = true;
      this.state.players[playerIndex].isConnected = false;

      // Check if it was their turn
      if (this.state.currentPlayerIndex === playerIndex) {
        this.advanceToNextPlayer();
      }
      this.checkRoundComplete();
    } else {
      this.state.players.splice(playerIndex, 1);
    }
  }

  sitOut(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) player.isSittingOut = true;
  }

  sitIn(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) player.isSittingOut = false;
  }

  addChips(playerId: string, amount: number): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;
    if (player.chips + amount > this.config.maxBuyIn) return false;
    player.chips += amount;
    return true;
  }

  canStartHand(): boolean {
    const activePlayers = this.state.players.filter(p => !p.isSittingOut && p.chips > 0);
    return activePlayers.length >= 2;
  }

  startHand(): boolean {
    if (!this.canStartHand()) return false;

    this.state.handNumber++;
    this.state.phase = 'pre-flop';
    this.state.communityCards = [];
    this.state.pots = [{ amount: 0, eligiblePlayerIds: [] }];
    this.state.winners = undefined;
    this.state.lastAction = undefined;
    this.actionLog = [];

    // Reset deck
    this.deck.reset(this.config.variant);

    // Reset player states
    for (const player of this.state.players) {
      player.cards = [];
      player.isFolded = player.isSittingOut || player.chips <= 0;
      player.isAllIn = false;
      player.currentBet = 0;
      player.totalBetThisRound = 0;
      player.hasActed = false;
      player.showCards = false;
      player.isDealer = false;
      player.isSmallBlind = false;
      player.isBigBlind = false;
      player.lastAction = undefined;
      player.winAmount = 0;
    }

    const activePlayers = this.getActivePlayers();

    // Move dealer button
    this.state.dealerIndex = this.findNextActivePlayerIndex(this.state.dealerIndex);
    activePlayers.find(p => p.seatIndex === this.state.players[this.state.dealerIndex]?.seatIndex)!;
    this.state.players[this.state.dealerIndex].isDealer = true;

    // Post blinds
    this.postBlinds(activePlayers);

    // Deal cards
    this.dealHoleCards(activePlayers);

    // Set first player to act
    this.setFirstPlayerToAct();

    this.state.turnStartTime = Date.now();

    return true;
  }

  private getActivePlayers(): Player[] {
    return this.state.players.filter(p => !p.isFolded && !p.isSittingOut && p.chips >= 0);
  }

  private getNonFoldedPlayers(): Player[] {
    return this.state.players.filter(p => !p.isFolded);
  }

  private findNextActivePlayerIndex(fromIndex: number): number {
    const len = this.state.players.length;
    let idx = (fromIndex + 1) % len;
    let attempts = 0;
    while (attempts < len) {
      const player = this.state.players[idx];
      if (!player.isFolded && !player.isSittingOut && player.chips >= 0) {
        return idx;
      }
      idx = (idx + 1) % len;
      attempts++;
    }
    return fromIndex;
  }

  private postBlinds(activePlayers: Player[]): void {
    if (activePlayers.length < 2) return;

    const dealerIdx = this.state.dealerIndex;

    if (activePlayers.length === 2) {
      // Heads up: dealer is SB
      const sbIdx = dealerIdx;
      const bbIdx = this.findNextActivePlayerIndex(dealerIdx);

      this.postBlind(sbIdx, this.state.smallBlindAmount, true, false);
      this.postBlind(bbIdx, this.state.bigBlindAmount, false, true);
    } else {
      const sbIdx = this.findNextActivePlayerIndex(dealerIdx);
      const bbIdx = this.findNextActivePlayerIndex(sbIdx);

      this.postBlind(sbIdx, this.state.smallBlindAmount, true, false);
      this.postBlind(bbIdx, this.state.bigBlindAmount, false, true);
    }

    // Post antes
    if (this.state.ante > 0) {
      for (const player of activePlayers) {
        const ante = Math.min(this.state.ante, player.chips);
        player.chips -= ante;
        player.currentBet += ante;
        player.totalBetThisRound += ante;
        this.state.pots[0].amount += ante;
        if (player.chips === 0) player.isAllIn = true;
      }
    }

    // Set eligible players for main pot
    this.state.pots[0].eligiblePlayerIds = activePlayers.map(p => p.id);
  }

  private postBlind(playerIdx: number, amount: number, isSmall: boolean, isBig: boolean): void {
    const player = this.state.players[playerIdx];
    const blindAmount = Math.min(amount, player.chips);
    player.chips -= blindAmount;
    player.currentBet = blindAmount;
    player.totalBetThisRound = blindAmount;
    player.isSmallBlind = isSmall;
    player.isBigBlind = isBig;
    this.state.pots[0].amount += blindAmount;
    if (player.chips === 0) player.isAllIn = true;
  }

  private dealHoleCards(activePlayers: Player[]): void {
    const cardsPerPlayer = this.config.variant === 'omaha' ? 4 : 2;
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (const player of activePlayers) {
        player.cards.push(this.deck.dealOne());
      }
    }
  }

  private setFirstPlayerToAct(): void {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) return;

    if (this.state.phase === 'pre-flop') {
      // First to act is after BB
      const bbPlayer = this.state.players.find(p => p.isBigBlind);
      if (bbPlayer) {
        const bbIdx = this.state.players.indexOf(bbPlayer);
        this.state.currentPlayerIndex = this.findNextActiveNonAllInPlayerIndex(bbIdx);
      }
    } else {
      // First to act is after dealer
      this.state.currentPlayerIndex = this.findNextActiveNonAllInPlayerIndex(this.state.dealerIndex);
    }

    // If everyone is all-in, no action needed
    const playersWhoCanAct = this.getNonFoldedPlayers().filter(p => !p.isAllIn);
    if (playersWhoCanAct.length <= 1) {
      this.runOutBoard();
    }
  }

  private findNextActiveNonAllInPlayerIndex(fromIndex: number): number {
    const len = this.state.players.length;
    let idx = (fromIndex + 1) % len;
    let attempts = 0;
    while (attempts < len) {
      const player = this.state.players[idx];
      if (!player.isFolded && !player.isSittingOut && !player.isAllIn) {
        return idx;
      }
      idx = (idx + 1) % len;
      attempts++;
    }
    return -1;
  }

  getValidActions(playerId: string): { actions: PlayerAction[]; minBet: number; maxBet: number } {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.isFolded || player.isAllIn) {
      return { actions: [], minBet: 0, maxBet: 0 };
    }

    const currentIdx = this.state.players.indexOf(player);
    if (currentIdx !== this.state.currentPlayerIndex) {
      return { actions: [], minBet: 0, maxBet: 0 };
    }

    const actions: PlayerAction[] = ['fold'];
    const highestBet = this.getHighestBet();
    const toCall = highestBet - player.currentBet;

    if (toCall === 0) {
      actions.push('check');
    } else if (toCall > 0) {
      actions.push('call');
    }

    if (this.state.bettingStructure === 'no-limit') {
      const minRaise = Math.max(this.state.bigBlindAmount, highestBet * 2 - player.currentBet);
      if (player.chips > toCall) {
        actions.push('raise');
        actions.push('all-in');
        return {
          actions,
          minBet: Math.min(minRaise, player.chips),
          maxBet: player.chips,
        };
      } else {
        actions.push('all-in');
        return { actions, minBet: player.chips, maxBet: player.chips };
      }
    } else if (this.state.bettingStructure === 'pot-limit') {
      const potSize = this.getTotalPotSize();
      const maxRaise = Math.min(potSize + toCall * 2, player.chips);
      if (player.chips > toCall) {
        actions.push('raise');
        return {
          actions,
          minBet: Math.min(this.state.bigBlindAmount * 2, player.chips),
          maxBet: maxRaise,
        };
      }
    }

    return { actions, minBet: toCall, maxBet: toCall };
  }

  processAction(playerId: string, action: PlayerActionRequest): boolean {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return false;

    const currentIdx = this.state.players.indexOf(player);
    if (currentIdx !== this.state.currentPlayerIndex) return false;

    const valid = this.getValidActions(playerId);
    if (!valid.actions.includes(action.action)) return false;

    const highestBet = this.getHighestBet();

    switch (action.action) {
      case 'fold':
        player.isFolded = true;
        player.lastAction = 'fold';
        break;

      case 'check':
        player.lastAction = 'check';
        break;

      case 'call': {
        const callAmount = Math.min(highestBet - player.currentBet, player.chips);
        player.chips -= callAmount;
        player.currentBet += callAmount;
        player.totalBetThisRound += callAmount;
        this.state.pots[0].amount += callAmount;
        player.lastAction = 'call';
        if (player.chips === 0) player.isAllIn = true;
        break;
      }

      case 'bet':
      case 'raise': {
        const amount = action.amount || valid.minBet;
        const totalBet = amount;
        const additional = totalBet - player.currentBet;
        if (additional > player.chips) return false;
        player.chips -= additional;
        player.currentBet = totalBet;
        player.totalBetThisRound += additional;
        this.state.pots[0].amount += additional;
        player.lastAction = action.action;
        this.state.minBet = totalBet;
        if (player.chips === 0) player.isAllIn = true;
        // Reset hasActed for other active players when there's a raise
        for (const p of this.state.players) {
          if (p.id !== playerId && !p.isFolded && !p.isAllIn) {
            p.hasActed = false;
          }
        }
        break;
      }

      case 'all-in': {
        const allInAmount = player.chips;
        player.currentBet += allInAmount;
        player.totalBetThisRound += allInAmount;
        this.state.pots[0].amount += allInAmount;
        player.chips = 0;
        player.isAllIn = true;
        player.lastAction = 'all-in';
        if (player.currentBet > highestBet) {
          for (const p of this.state.players) {
            if (p.id !== playerId && !p.isFolded && !p.isAllIn) {
              p.hasActed = false;
            }
          }
        }
        break;
      }
    }

    player.hasActed = true;
    this.state.lastAction = { playerId, action: action.action, amount: action.amount };
    this.state.turnStartTime = Date.now();

    // Log action
    this.actionLog.push({
      playerId,
      playerName: player.name,
      action: action.action,
      amount: action.amount,
      phase: this.state.phase,
    });

    // Check if only one player remains
    const nonFolded = this.getNonFoldedPlayers();
    if (nonFolded.length === 1) {
      this.awardPotToLastPlayer(nonFolded[0]);
      return true;
    }

    this.advanceToNextPlayer();
    this.checkRoundComplete();

    return true;
  }

  private getHighestBet(): number {
    return Math.max(0, ...this.state.players.map(p => p.currentBet));
  }

  private getTotalPotSize(): number {
    return this.state.pots.reduce((sum, pot) => sum + pot.amount, 0);
  }

  private advanceToNextPlayer(): void {
    const nextIdx = this.findNextActiveNonAllInPlayerIndex(this.state.currentPlayerIndex);
    this.state.currentPlayerIndex = nextIdx;
  }

  private checkRoundComplete(): void {
    const activePlayers = this.getNonFoldedPlayers().filter(p => !p.isAllIn);
    const highestBet = this.getHighestBet();

    // Check if all active (non-all-in) players have acted and matched the highest bet
    const allActed = activePlayers.every(p => p.hasActed && p.currentBet === highestBet);

    if (allActed || activePlayers.length === 0) {
      this.calculateSidePots();
      this.advancePhase();
    }
  }

  private calculateSidePots(): void {
    const nonFolded = this.getNonFoldedPlayers();
    if (!nonFolded.some(p => p.isAllIn)) return;

    // Collect all unique bet levels from all-in players
    const allInBets = nonFolded
      .filter(p => p.isAllIn)
      .map(p => p.totalBetThisRound)
      .sort((a, b) => a - b);

    if (allInBets.length === 0) return;

    const pots: Pot[] = [];
    let processedBet = 0;

    for (const betLevel of [...new Set(allInBets)]) {
      const contribution = betLevel - processedBet;
      const eligiblePlayers = nonFolded.filter(p => p.totalBetThisRound >= betLevel);
      const potAmount = contribution * eligiblePlayers.length;

      if (potAmount > 0) {
        pots.push({
          amount: potAmount,
          eligiblePlayerIds: eligiblePlayers.map(p => p.id),
        });
      }
      processedBet = betLevel;
    }

    // Remaining side pot for players who bet more
    const maxAllIn = Math.max(...allInBets);
    const remainingPlayers = nonFolded.filter(p => p.totalBetThisRound > maxAllIn);
    if (remainingPlayers.length > 0) {
      const remaining = remainingPlayers.reduce((sum, p) => sum + (p.totalBetThisRound - maxAllIn), 0);
      if (remaining > 0) {
        pots.push({
          amount: remaining,
          eligiblePlayerIds: remainingPlayers.map(p => p.id),
        });
      }
    }

    if (pots.length > 0) {
      this.state.pots = pots;
    }
  }

  private advancePhase(): void {
    // Reset for next betting round
    for (const player of this.state.players) {
      player.currentBet = 0;
      player.hasActed = false;
    }

    const nonFolded = this.getNonFoldedPlayers();
    const canAct = nonFolded.filter(p => !p.isAllIn);

    switch (this.state.phase) {
      case 'pre-flop':
        this.state.phase = 'flop';
        this.deck.burn();
        this.state.communityCards = this.deck.deal(3);
        break;
      case 'flop':
        this.state.phase = 'turn';
        this.deck.burn();
        this.state.communityCards.push(this.deck.dealOne());
        break;
      case 'turn':
        this.state.phase = 'river';
        this.deck.burn();
        this.state.communityCards.push(this.deck.dealOne());
        break;
      case 'river':
        this.showdown();
        return;
    }

    // If fewer than 2 players can act, run out the board
    if (canAct.length < 2) {
      this.runOutBoard();
      return;
    }

    this.setFirstPlayerToAct();
    this.state.turnStartTime = Date.now();
  }

  private runOutBoard(): void {
    // Check if Run It Twice is enabled and all remaining players are all-in
    const nonFolded = this.getNonFoldedPlayers();
    const allAllIn = nonFolded.every(p => p.isAllIn);

    if (this.config.runItTwice && allAllIn && nonFolded.length >= 2) {
      this.runItTwice();
      return;
    }

    // Deal remaining community cards (single board)
    while (this.state.communityCards.length < 5) {
      if (this.state.communityCards.length === 0) {
        this.deck.burn();
        this.state.communityCards.push(...this.deck.deal(3));
      } else {
        this.deck.burn();
        this.state.communityCards.push(this.deck.dealOne());
      }
    }
    this.showdown();
  }

  private runItTwice(): void {
    const existingCards = [...this.state.communityCards];
    const cardsNeeded = 5 - existingCards.length;

    // Board 1: deal remaining cards
    const board1Cards: Card[] = [];
    for (let i = 0; i < cardsNeeded; i++) {
      this.deck.burn();
      board1Cards.push(this.deck.dealOne());
    }
    this.state.communityCards = [...existingCards, ...board1Cards];

    // Board 2: deal another set of remaining cards
    const board2Cards: Card[] = [];
    for (let i = 0; i < cardsNeeded; i++) {
      this.deck.burn();
      board2Cards.push(this.deck.dealOne());
    }
    const board2 = [...existingCards, ...board2Cards];

    // Showdown with split pots
    this.state.phase = 'showdown';
    const nonFolded = this.getNonFoldedPlayers();

    for (const player of nonFolded) {
      player.showCards = true;
    }

    const allWinners: { playerId: string; amount: number; hand?: HandResult }[] = [];
    const board2Winners: { playerId: string; amount: number; hand?: HandResult }[] = [];

    // Award each pot split 50/50 between the two boards
    for (const pot of this.state.pots) {
      const eligiblePlayers = nonFolded.filter(p => pot.eligiblePlayerIds.includes(p.id));
      if (eligiblePlayers.length === 0) continue;

      const halfPot1 = Math.ceil(pot.amount / 2);
      const halfPot2 = pot.amount - halfPot1;

      // Board 1 winners
      this.awardPotToWinners(eligiblePlayers, this.state.communityCards, halfPot1, pot, allWinners);

      // Board 2 winners
      this.awardPotToWinners(eligiblePlayers, board2, halfPot2, pot, board2Winners);
    }

    this.state.winners = allWinners;
    this.state.runItTwice = { board2, winners2: board2Winners };

    this.recordHand();
    this.state.phase = 'finished';
  }

  private awardPotToWinners(
    eligiblePlayers: Player[],
    communityCards: Card[],
    potAmount: number,
    pot: Pot,
    winnersArray: { playerId: string; amount: number; hand?: HandResult }[],
  ): void {
    if (eligiblePlayers.length === 1) {
      eligiblePlayers[0].chips += potAmount;
      eligiblePlayers[0].winAmount += potAmount;
      winnersArray.push({ playerId: eligiblePlayers[0].id, amount: potAmount });
      return;
    }

    const winners = determineWinners(
      eligiblePlayers.map(p => ({ id: p.id, holeCards: p.cards })),
      communityCards,
      this.config.variant
    );

    const share = Math.floor(potAmount / winners.length);
    const remainder = potAmount - share * winners.length;

    winners.forEach((winner, index) => {
      const player = this.state.players.find(p => p.id === winner.playerId)!;
      const winAmount = share + (index === 0 ? remainder : 0);
      player.chips += winAmount;
      player.winAmount += winAmount;
      winnersArray.push({ playerId: winner.playerId, amount: winAmount, hand: winner.hand });
    });
  }

  private showdown(): void {
    this.state.phase = 'showdown';
    const nonFolded = this.getNonFoldedPlayers();

    // Show all remaining player cards
    for (const player of nonFolded) {
      player.showCards = true;
    }

    const allWinners: { playerId: string; amount: number; hand?: HandResult }[] = [];

    // Award each pot
    for (const pot of this.state.pots) {
      const eligiblePlayers = nonFolded.filter(p => pot.eligiblePlayerIds.includes(p.id));
      if (eligiblePlayers.length === 0) continue;

      if (eligiblePlayers.length === 1) {
        eligiblePlayers[0].chips += pot.amount;
        eligiblePlayers[0].winAmount += pot.amount;
        allWinners.push({ playerId: eligiblePlayers[0].id, amount: pot.amount });
        pot.winners = [eligiblePlayers[0].id];
        continue;
      }

      const winners = determineWinners(
        eligiblePlayers.map(p => ({ id: p.id, holeCards: p.cards })),
        this.state.communityCards,
        this.config.variant
      );

      const share = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount - share * winners.length;

      pot.winners = winners.map(w => w.playerId);

      winners.forEach((winner, index) => {
        const player = this.state.players.find(p => p.id === winner.playerId)!;
        const winAmount = share + (index === 0 ? remainder : 0);
        player.chips += winAmount;
        player.winAmount += winAmount;
        allWinners.push({ playerId: winner.playerId, amount: winAmount, hand: winner.hand });
      });
    }

    this.state.winners = allWinners;

    // Record hand history
    this.recordHand();

    // Transition to finished after a delay (handled by server/UI)
    this.state.phase = 'finished';
  }

  private awardPotToLastPlayer(winner: Player): void {
    this.state.phase = 'finished';
    const totalPot = this.getTotalPotSize();
    winner.chips += totalPot;
    winner.winAmount = totalPot;
    this.state.winners = [{ playerId: winner.id, amount: totalPot }];

    this.recordHand();
  }

  private recordHand(): void {
    const record: HandRecord = {
      handNumber: this.state.handNumber,
      timestamp: Date.now(),
      variant: this.config.variant,
      players: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        startChips: p.chips - p.winAmount + p.totalBetThisRound,
        endChips: p.chips,
        cards: p.showCards ? p.cards : undefined,
      })),
      communityCards: [...this.state.communityCards],
      pots: [...this.state.pots],
      actions: [...this.actionLog],
      winners: (this.state.winners || []).map(w => ({
        ...w,
        playerName: this.state.players.find(p => p.id === w.playerId)?.name || 'Unknown',
      })),
    };
    this.handHistory.push(record);
  }

  getHandHistory(): HandRecord[] {
    return [...this.handHistory];
  }

  getLastHand(): HandRecord | undefined {
    return this.handHistory[this.handHistory.length - 1];
  }

  // Auto-fold for disconnected/timed out players
  autoFold(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) return;
    const currentIdx = this.state.players.indexOf(player);
    if (currentIdx === this.state.currentPlayerIndex) {
      this.processAction(playerId, { action: 'fold' });
    }
  }

  showCards(playerId: string): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (player) player.showCards = true;
  }

  isHandInProgress(): boolean {
    return this.state.phase !== 'waiting' && this.state.phase !== 'finished';
  }

  getCurrentPlayerId(): string | null {
    if (this.state.currentPlayerIndex < 0) return null;
    return this.state.players[this.state.currentPlayerIndex]?.id || null;
  }
}
