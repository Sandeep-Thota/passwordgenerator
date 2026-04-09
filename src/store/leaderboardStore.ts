// ==========================================
// PokerZone - Leaderboard Store
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatar: string;
  totalProfit: number;
  handsPlayed: number;
  handsWon: number;
  sessionsPlayed: number;
  biggestWin: number;
  bestHand: string;
  lastPlayed: number; // timestamp
}

interface LeaderboardStore {
  entries: LeaderboardEntry[];
  updatePlayer: (entry: Partial<LeaderboardEntry> & { playerId: string; playerName: string }) => void;
  getTopPlayers: (limit?: number) => LeaderboardEntry[];
  getPlayerRank: (playerId: string) => number;
  clearLeaderboard: () => void;
}

export const useLeaderboardStore = create<LeaderboardStore>()(
  persist(
    (set, get) => ({
      entries: [],

      updatePlayer: (entry) => set((state) => {
        const existingIndex = state.entries.findIndex((e) => e.playerId === entry.playerId);

        if (existingIndex >= 0) {
          // Update existing entry — merge partial fields
          const existing = state.entries[existingIndex];
          const updated: LeaderboardEntry = {
            ...existing,
            playerName: entry.playerName,
            avatar: entry.avatar ?? existing.avatar,
            totalProfit: existing.totalProfit + (entry.totalProfit ?? 0),
            handsPlayed: existing.handsPlayed + (entry.handsPlayed ?? 0),
            handsWon: existing.handsWon + (entry.handsWon ?? 0),
            sessionsPlayed: existing.sessionsPlayed + (entry.sessionsPlayed ?? 0),
            biggestWin: Math.max(existing.biggestWin, entry.biggestWin ?? 0),
            bestHand: entry.bestHand ?? existing.bestHand,
            lastPlayed: entry.lastPlayed ?? existing.lastPlayed,
          };

          const newEntries = [...state.entries];
          newEntries[existingIndex] = updated;
          return { entries: newEntries };
        } else {
          // Add new entry
          const newEntry: LeaderboardEntry = {
            playerId: entry.playerId,
            playerName: entry.playerName,
            avatar: entry.avatar ?? 'ace',
            totalProfit: entry.totalProfit ?? 0,
            handsPlayed: entry.handsPlayed ?? 0,
            handsWon: entry.handsWon ?? 0,
            sessionsPlayed: entry.sessionsPlayed ?? 0,
            biggestWin: entry.biggestWin ?? 0,
            bestHand: entry.bestHand ?? 'None',
            lastPlayed: entry.lastPlayed ?? Date.now(),
          };
          return { entries: [...state.entries, newEntry] };
        }
      }),

      getTopPlayers: (limit = 50) => {
        return [...get().entries]
          .sort((a, b) => b.totalProfit - a.totalProfit)
          .slice(0, limit);
      },

      getPlayerRank: (playerId) => {
        const sorted = [...get().entries].sort((a, b) => b.totalProfit - a.totalProfit);
        const index = sorted.findIndex((e) => e.playerId === playerId);
        return index >= 0 ? index + 1 : -1;
      },

      clearLeaderboard: () => set({ entries: [] }),
    }),
    {
      name: 'pokerzone-leaderboard',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
