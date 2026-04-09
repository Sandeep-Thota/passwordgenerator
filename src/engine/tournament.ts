// ==========================================
// PokerZone - Tournament Engine
// ==========================================

import { PokerGame } from './poker-game';
import {
  Tournament, TournamentConfig, RoomConfig, GameVariant,
} from './types';

const DEFAULT_BLIND_LEVELS = [
  { smallBlind: 10, bigBlind: 20, ante: 0, duration: 600 },     // 10 min
  { smallBlind: 15, bigBlind: 30, ante: 0, duration: 600 },
  { smallBlind: 25, bigBlind: 50, ante: 5, duration: 600 },
  { smallBlind: 50, bigBlind: 100, ante: 10, duration: 600 },
  { smallBlind: 75, bigBlind: 150, ante: 15, duration: 480 },   // 8 min
  { smallBlind: 100, bigBlind: 200, ante: 25, duration: 480 },
  { smallBlind: 150, bigBlind: 300, ante: 30, duration: 480 },
  { smallBlind: 200, bigBlind: 400, ante: 50, duration: 360 },  // 6 min
  { smallBlind: 300, bigBlind: 600, ante: 60, duration: 360 },
  { smallBlind: 500, bigBlind: 1000, ante: 100, duration: 360 },
  { smallBlind: 750, bigBlind: 1500, ante: 150, duration: 300 }, // 5 min
  { smallBlind: 1000, bigBlind: 2000, ante: 200, duration: 300 },
  { smallBlind: 1500, bigBlind: 3000, ante: 300, duration: 300 },
  { smallBlind: 2000, bigBlind: 4000, ante: 400, duration: 300 },
  { smallBlind: 3000, bigBlind: 6000, ante: 600, duration: 300 },
];

const DEFAULT_PAYOUT_STRUCTURE: Record<number, number[]> = {
  2: [100],
  3: [75, 25],
  4: [65, 25, 10],
  5: [60, 25, 15],
  6: [55, 25, 15, 5],
  7: [50, 25, 15, 10],
  8: [45, 25, 15, 10, 5],
  9: [40, 25, 15, 10, 5, 5],
};

export class TournamentManager {
  private tournaments: Map<string, TournamentState> = new Map();

  createTournament(config: TournamentConfig): Tournament {
    const id = Math.random().toString(36).substring(2, 15);
    const blindLevels = config.blindLevels.length > 0
      ? config.blindLevels
      : DEFAULT_BLIND_LEVELS;

    const tournament: Tournament = {
      id,
      config: { ...config, blindLevels },
      status: 'registering',
      tables: [],
      registeredPlayers: [],
      eliminatedPlayers: [],
      currentLevel: 0,
      levelStartTime: 0,
      totalPrizePool: 0,
    };

    this.tournaments.set(id, {
      tournament,
      games: new Map(),
      levelTimer: null,
    });

    return tournament;
  }

  registerPlayer(tournamentId: string, playerId: string, playerName: string): boolean {
    const state = this.tournaments.get(tournamentId);
    if (!state) return false;
    if (state.tournament.status !== 'registering') return false;
    if (state.tournament.registeredPlayers.length >= state.tournament.config.maxPlayers) return false;
    if (state.tournament.registeredPlayers.find(p => p.id === playerId)) return false;

    state.tournament.registeredPlayers.push({ id: playerId, name: playerName, rebuys: 0 });
    state.tournament.totalPrizePool += state.tournament.config.buyIn;

    return true;
  }

  startTournament(tournamentId: string): boolean {
    const state = this.tournaments.get(tournamentId);
    if (!state) return false;
    if (state.tournament.registeredPlayers.length < 2) return false;

    state.tournament.status = 'running';
    state.tournament.currentLevel = 0;
    state.tournament.levelStartTime = Date.now();

    // Create tables - for now single table
    this.createTables(state);
    this.startLevelTimer(state);

    return true;
  }

  private createTables(state: TournamentState): void {
    const playersPerTable = Math.min(9, state.tournament.registeredPlayers.length);
    const numTables = Math.ceil(state.tournament.registeredPlayers.length / playersPerTable);

    const level = state.tournament.config.blindLevels[state.tournament.currentLevel];

    for (let t = 0; t < numTables; t++) {
      const tableConfig: RoomConfig = {
        name: `Table ${t + 1}`,
        variant: state.tournament.config.variant,
        bettingStructure: 'no-limit',
        smallBlind: level.smallBlind,
        bigBlind: level.bigBlind,
        ante: level.ante,
        minBuyIn: state.tournament.config.startingChips,
        maxBuyIn: state.tournament.config.startingChips,
        maxPlayers: playersPerTable,
        turnTimeLimit: 30,
        autoStart: true,
        isPrivate: true,
        allowStraddle: false,
        runItTwice: false,
      };

      const game = new PokerGame(tableConfig);

      // Seat players at this table
      const startIdx = t * playersPerTable;
      const endIdx = Math.min(startIdx + playersPerTable, state.tournament.registeredPlayers.length);

      for (let i = startIdx; i < endIdx; i++) {
        const player = state.tournament.registeredPlayers[i];
        game.addPlayer(
          player.id,
          player.name,
          'ace',
          state.tournament.config.startingChips,
          i - startIdx
        );
      }

      state.games.set(`table-${t}`, game);
    }
  }

  private startLevelTimer(state: TournamentState): void {
    const level = state.tournament.config.blindLevels[state.tournament.currentLevel];
    if (!level) return;

    state.levelTimer = setTimeout(() => {
      this.advanceLevel(state);
    }, level.duration * 1000) as any;
  }

  private advanceLevel(state: TournamentState): void {
    state.tournament.currentLevel++;
    state.tournament.levelStartTime = Date.now();

    if (state.tournament.currentLevel >= state.tournament.config.blindLevels.length) {
      // Repeat last level
      state.tournament.currentLevel = state.tournament.config.blindLevels.length - 1;
    }

    // Update blinds on all tables
    const level = state.tournament.config.blindLevels[state.tournament.currentLevel];
    // Blinds are updated when the next hand starts

    this.startLevelTimer(state);
  }

  eliminatePlayer(tournamentId: string, playerId: string): void {
    const state = this.tournaments.get(tournamentId);
    if (!state) return;

    const player = state.tournament.registeredPlayers.find(p => p.id === playerId);
    if (!player) return;

    const remainingPlayers = state.tournament.registeredPlayers.length - state.tournament.eliminatedPlayers.length - 1;
    const position = remainingPlayers + 1;

    // Calculate prize
    const payouts = this.getPayoutStructure(state.tournament);
    const prizePercentage = position <= payouts.length ? payouts[position - 1] : 0;
    const prize = Math.floor((prizePercentage / 100) * state.tournament.totalPrizePool);

    state.tournament.eliminatedPlayers.push({
      id: playerId,
      name: player.name,
      position,
      prize,
    });

    // Check if tournament is over (1 player left)
    if (remainingPlayers <= 1) {
      this.finishTournament(state);
    }
  }

  private getPayoutStructure(tournament: Tournament): number[] {
    const numPlayers = tournament.registeredPlayers.length;
    if (tournament.config.payoutStructure.length > 0) {
      return tournament.config.payoutStructure;
    }
    return DEFAULT_PAYOUT_STRUCTURE[Math.min(numPlayers, 9)] || [100];
  }

  private finishTournament(state: TournamentState): void {
    state.tournament.status = 'finished';
    if (state.levelTimer) {
      clearTimeout(state.levelTimer as any);
    }

    // Award winner
    const eliminatedIds = new Set(state.tournament.eliminatedPlayers.map(p => p.id));
    const winner = state.tournament.registeredPlayers.find(p => !eliminatedIds.has(p.id));

    if (winner) {
      const payouts = this.getPayoutStructure(state.tournament);
      const firstPrize = Math.floor((payouts[0] / 100) * state.tournament.totalPrizePool);

      state.tournament.eliminatedPlayers.push({
        id: winner.id,
        name: winner.name,
        position: 1,
        prize: firstPrize,
      });
    }
  }

  getTournament(id: string): Tournament | undefined {
    return this.tournaments.get(id)?.tournament;
  }

  getLevelTimeRemaining(tournamentId: string): number {
    const state = this.tournaments.get(tournamentId);
    if (!state) return 0;

    const level = state.tournament.config.blindLevels[state.tournament.currentLevel];
    if (!level) return 0;

    const elapsed = (Date.now() - state.tournament.levelStartTime) / 1000;
    return Math.max(0, level.duration - elapsed);
  }
}

interface TournamentState {
  tournament: Tournament;
  games: Map<string, PokerGame>;
  levelTimer: NodeJS.Timeout | null;
}

// Sit & Go - a simplified tournament that starts when seats are filled
export function createSitAndGo(
  maxPlayers: 6 | 9,
  buyIn: number,
  variant: GameVariant = 'texas-holdem'
): TournamentConfig {
  return {
    name: `Sit & Go ${maxPlayers}-max`,
    variant,
    buyIn,
    startingChips: buyIn * 100,
    blindLevels: DEFAULT_BLIND_LEVELS.slice(0, 10),
    maxPlayers,
    payoutStructure: maxPlayers === 6
      ? [65, 25, 10]
      : [50, 25, 15, 10],
    lateRegistrationLevels: 0,
    rebuyAllowed: false,
    maxRebuys: 0,
    addOnAllowed: false,
  };
}
