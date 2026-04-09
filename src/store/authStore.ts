// ==========================================
// PokerZone - Auth/Profile Store
// ==========================================

import { create } from 'zustand';
import { generateGuestName } from '../utils/formatters';
import { AVATARS } from '../constants/theme';

interface PlayerStats {
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
  totalWinnings: number;
  bestHand: string;
  gamesJoined: number;
  tournamentsWon: number;
}

interface AuthStore {
  // Player profile
  playerName: string;
  setPlayerName: (name: string) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;

  // Stats
  stats: PlayerStats;
  updateStats: (updates: Partial<PlayerStats>) => void;

  // Settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;
  showHandStrength: boolean;
  setShowHandStrength: (show: boolean) => void;
  autoMuck: boolean;
  setAutoMuck: (muck: boolean) => void;
  fourColorDeck: boolean;
  setFourColorDeck: (enabled: boolean) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Initialize with random guest profile
  initGuest: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),
  avatar: 'ace',
  setAvatar: (avatar) => set({ avatar }),

  stats: {
    handsPlayed: 0,
    handsWon: 0,
    biggestPot: 0,
    totalWinnings: 0,
    bestHand: 'None',
    gamesJoined: 0,
    tournamentsWon: 0,
  },
  updateStats: (updates) => set((state) => ({
    stats: { ...state.stats, ...updates },
  })),

  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  hapticEnabled: true,
  setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
  showHandStrength: false,
  setShowHandStrength: (show) => set({ showHandStrength: show }),
  autoMuck: true,
  setAutoMuck: (muck) => set({ autoMuck: muck }),
  fourColorDeck: false,
  setFourColorDeck: (enabled) => set({ fourColorDeck: enabled }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  initGuest: () => set({
    playerName: generateGuestName(),
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  }),
}));
