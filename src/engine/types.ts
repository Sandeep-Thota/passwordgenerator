// ==========================================
// PokerZone - Core Type Definitions
// ==========================================

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
  code: string; // e.g., "Ah" for Ace of hearts
}

export type HandRank =
  | 'Royal Flush'
  | 'Straight Flush'
  | 'Four of a Kind'
  | 'Full House'
  | 'Flush'
  | 'Straight'
  | 'Three of a Kind'
  | 'Two Pair'
  | 'One Pair'
  | 'High Card';

export interface HandResult {
  rank: HandRank;
  score: number;       // Numeric score for comparison
  cards: Card[];       // Best 5 cards
  description: string; // e.g., "Pair of Aces"
}

export type GameVariant = 'texas-holdem' | 'omaha' | 'short-deck';
export type BettingStructure = 'no-limit' | 'pot-limit' | 'fixed-limit';
export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

export interface PlayerActionRequest {
  action: PlayerAction;
  amount?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  seatIndex: number;
  cards: Card[];
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  isSittingOut: boolean;
  isConnected: boolean;
  currentBet: number;
  totalBetThisRound: number;
  hasActed: boolean;
  showCards: boolean;
  lastAction?: PlayerAction;
  timeBank: number; // seconds remaining in time bank
  winAmount: number;
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
  winners?: string[];
}

export interface GameState {
  id: string;
  variant: GameVariant;
  bettingStructure: BettingStructure;
  phase: GamePhase;
  players: Player[];
  communityCards: Card[];
  pots: Pot[];
  currentPlayerIndex: number;
  dealerIndex: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  ante: number;
  minBet: number;
  maxBuyIn: number;
  minBuyIn: number;
  turnTimeLimit: number; // seconds
  turnStartTime: number;
  handNumber: number;
  lastAction?: { playerId: string; action: PlayerAction; amount?: number };
  winners?: { playerId: string; amount: number; hand?: HandResult }[];
  // Run It Twice: second board and results
  runItTwice?: {
    board2: Card[];
    winners2: { playerId: string; amount: number; hand?: HandResult }[];
  };
}

export interface RoomConfig {
  name: string;
  variant: GameVariant;
  bettingStructure: BettingStructure;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxPlayers: number;
  turnTimeLimit: number;
  autoStart: boolean;
  isPrivate: boolean;
  allowStraddle: boolean;
  runItTwice: boolean;
}

export interface Room {
  id: string;
  code: string;  // Short code for sharing
  config: RoomConfig;
  hostId: string;
  createdAt: number;
  gameState: GameState | null;
  chatMessages: ChatMessage[];
  spectators: { id: string; name: string }[];
  handHistory: HandRecord[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  type: 'chat' | 'system' | 'emoji-reaction';
}

export interface HandRecord {
  handNumber: number;
  timestamp: number;
  variant: GameVariant;
  players: { id: string; name: string; startChips: number; endChips: number; cards?: Card[] }[];
  communityCards: Card[];
  pots: Pot[];
  actions: { playerId: string; playerName: string; action: PlayerAction; amount?: number; phase: GamePhase }[];
  winners: { playerId: string; playerName: string; amount: number; hand?: HandResult }[];
}

export interface LedgerEntry {
  playerId: string;
  playerName: string;
  avatar: string;
  buyIns: number;        // total number of buy-ins
  totalBuyIn: number;    // total chips bought in
  cashOut: number;       // chips at end (current stack)
  netProfit: number;     // cashOut - totalBuyIn
  handsPlayed: number;
  handsWon: number;
  biggestPot: number;
}

export interface TournamentConfig {
  name: string;
  variant: GameVariant;
  buyIn: number;
  startingChips: number;
  blindLevels: { smallBlind: number; bigBlind: number; ante: number; duration: number }[];
  maxPlayers: number;
  payoutStructure: number[]; // percentages
  lateRegistrationLevels: number;
  rebuyAllowed: boolean;
  maxRebuys: number;
  addOnAllowed: boolean;
}

export interface Tournament {
  id: string;
  config: TournamentConfig;
  status: 'registering' | 'running' | 'paused' | 'finished';
  tables: Room[];
  registeredPlayers: { id: string; name: string; rebuys: number }[];
  eliminatedPlayers: { id: string; name: string; position: number; prize: number }[];
  currentLevel: number;
  levelStartTime: number;
  totalPrizePool: number;
}

// Socket event types
export interface ServerToClientEvents {
  'room:state': (room: Room) => void;
  'game:state': (state: GameState) => void;
  'game:action-required': (data: { playerId: string; validActions: PlayerAction[]; minBet: number; maxBet: number; timeLimit: number }) => void;
  'game:result': (winners: { playerId: string; amount: number; hand?: HandResult }[]) => void;
  'chat:message': (message: ChatMessage) => void;
  'room:player-joined': (player: { id: string; name: string; avatar: string }) => void;
  'room:player-left': (playerId: string) => void;
  'error': (message: string) => void;
  'tournament:update': (tournament: Tournament) => void;
}

export interface ClientToServerEvents {
  'room:create': (config: RoomConfig, callback: (room: Room) => void) => void;
  'room:join': (data: { roomCode: string; playerName: string; avatar: string; buyIn: number }, callback: (room: Room | null, error?: string) => void) => void;
  'room:leave': () => void;
  'game:action': (action: PlayerActionRequest) => void;
  'game:sit': (seatIndex: number) => void;
  'game:stand': () => void;
  'game:add-chips': (amount: number) => void;
  'game:show-cards': () => void;
  'chat:send': (message: string) => void;
  'chat:emoji': (emoji: string) => void;
  'tournament:register': (tournamentId: string) => void;
}
