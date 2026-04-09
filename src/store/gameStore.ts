// ==========================================
// PokerZone - Game Store (Zustand)
// ==========================================

import { create } from 'zustand';
import {
  GameState, Room, ChatMessage, PlayerAction,
  PlayerActionRequest, HandRecord, GamePhase,
} from '../engine/types';

interface GameStore {
  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Current room
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;

  // Game state
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;

  // Player info
  playerId: string;
  setPlayerId: (id: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Action state
  validActions: PlayerAction[];
  minBet: number;
  maxBet: number;
  setActionRequired: (actions: PlayerAction[], minBet: number, maxBet: number) => void;
  clearActions: () => void;

  // Hand history
  handHistory: HandRecord[];
  addHandRecord: (record: HandRecord) => void;

  // UI state
  isChatExpanded: boolean;
  toggleChat: () => void;
  showHandHistory: boolean;
  toggleHandHistory: () => void;

  // Game results
  lastWinners: { playerId: string; amount: number; hand?: any }[];
  setLastWinners: (winners: { playerId: string; amount: number; hand?: any }[]) => void;

  // Reset
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isConnected: false,
  setConnected: (connected) => set({ isConnected: connected }),

  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),

  gameState: null,
  setGameState: (state) => set({ gameState: state }),

  playerId: '',
  setPlayerId: (id) => set({ playerId: id }),

  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-199), message],
  })),
  clearChat: () => set({ chatMessages: [] }),

  validActions: [],
  minBet: 0,
  maxBet: 0,
  setActionRequired: (actions, minBet, maxBet) => set({ validActions: actions, minBet, maxBet }),
  clearActions: () => set({ validActions: [], minBet: 0, maxBet: 0 }),

  handHistory: [],
  addHandRecord: (record) => set((state) => ({
    handHistory: [...state.handHistory, record],
  })),

  isChatExpanded: false,
  toggleChat: () => set((state) => ({ isChatExpanded: !state.isChatExpanded })),
  showHandHistory: false,
  toggleHandHistory: () => set((state) => ({ showHandHistory: !state.showHandHistory })),

  lastWinners: [],
  setLastWinners: (winners) => set({ lastWinners: winners }),

  reset: () => set({
    currentRoom: null,
    gameState: null,
    chatMessages: [],
    validActions: [],
    minBet: 0,
    maxBet: 0,
    handHistory: [],
    isChatExpanded: false,
    showHandHistory: false,
    lastWinners: [],
  }),
}));
