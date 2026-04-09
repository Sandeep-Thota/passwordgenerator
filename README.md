# PokerZone

**Premium Multiplayer Poker for Web, iOS & Android**

A full-featured, real-time multiplayer poker application built with React Native (Expo) and Node.js. Play Texas Hold'em, Omaha, and Short Deck with friends on any device.

## Features

### Core Poker
- **Texas Hold'em** - The world's most popular poker variant
- **Pot Limit Omaha** - 4 hole cards, must use exactly 2
- **Short Deck (6+)** - Removed 2-5s, modified hand rankings
- **No Limit / Pot Limit / Fixed Limit** betting structures
- Complete hand evaluation engine with proper ranking
- Side pot calculation for multi-way all-in scenarios
- Automatic dealer button rotation and blind posting

### Multiplayer
- **Real-time** gameplay via WebSocket (Socket.IO)
- Create private or public tables
- Share 6-character room codes to invite friends
- Up to 9 players per table
- Spectator mode
- Auto-start when enough players join
- Configurable turn timers with auto-fold

### Game Experience
- Beautiful dark theme with gold accents
- Animated card dealing and chip movements
- Emoji reactions at the table
- In-game chat system
- Hand strength indicator (toggle-able)
- Four-color deck option
- Haptic feedback on mobile
- Sound effects

### Social & Stats
- Player profiles with customizable avatars
- Hand history with full action replay
- Win rate, biggest pot, and total profit tracking
- Achievement system (First Win, Hot Streak, High Roller, etc.)

### Tournament Mode
- Multi-table tournament support
- Configurable blind levels and schedules
- Automatic payout calculation
- Sit & Go (6-max, 9-max)
- Rebuy and add-on support
- Late registration windows

### Room Customization
- Custom table names
- Configurable blinds and antes
- Min/max buy-in ranges
- Turn time limits (15s - 60s)
- Straddle option
- Private/public toggle

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native + Expo |
| **Web** | React Native Web |
| **Navigation** | Expo Router |
| **State** | Zustand |
| **Realtime** | Socket.IO |
| **Server** | Node.js + Express |
| **Language** | TypeScript |

## Project Structure

```
pokerzone/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Lobby
│   │   ├── profile.tsx           # Player profile & stats
│   │   ├── history.tsx           # Hand history
│   │   └── settings.tsx          # App settings
│   ├── game/[id].tsx             # Game room
│   └── create-room.tsx           # Create table
├── src/
│   ├── engine/                   # Poker game engine
│   │   ├── types.ts              # TypeScript types
│   │   ├── deck.ts               # Card deck management
│   │   ├── hand-evaluator.ts     # Hand ranking & comparison
│   │   ├── poker-game.ts         # Core game logic
│   │   └── tournament.ts         # Tournament engine
│   ├── components/
│   │   ├── game/                 # Game UI components
│   │   │   ├── PokerTable.tsx    # Main table view
│   │   │   ├── Card.tsx          # Playing card
│   │   │   ├── PlayerSeat.tsx    # Player seat with info
│   │   │   ├── ActionPanel.tsx   # Bet/fold/raise controls
│   │   │   ├── CommunityCards.tsx
│   │   │   └── PotDisplay.tsx
│   │   ├── chat/ChatPanel.tsx    # In-game chat
│   │   ├── lobby/RoomCard.tsx    # Room listing card
│   │   └── ui/                   # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Avatar.tsx
│   │       └── Modal.tsx
│   ├── hooks/useSocket.ts        # WebSocket connection
│   ├── store/                    # Zustand state stores
│   │   ├── gameStore.ts
│   │   └── authStore.ts
│   ├── constants/                # Theme & config
│   │   ├── theme.ts
│   │   └── cards.ts
│   └── utils/formatters.ts       # Utility functions
└── server/                       # Backend server
    ├── index.ts                  # Express + Socket.IO
    └── RoomManager.ts            # Room lifecycle
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Install dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### Running the App

```bash
# Start the Expo dev server (for mobile & web)
npm start

# Run on web
npm run web

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Running the Server

```bash
# Development mode with auto-reload
npm run server:dev

# Production
npm run server
```

The server runs on port 3001 by default.

### How to Play

1. **Create a table** - Choose game type, blinds, and settings
2. **Share the room code** - Send the 6-character code to friends
3. **Join** - Friends enter the code or join from the lobby
4. **Play!** - The game auto-starts when 2+ players are seated

## Game Rules

### Hand Rankings (Standard)
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. One Pair
10. High Card

### Short Deck (6+) Changes
- Cards 2-5 are removed (36-card deck)
- Flush beats Full House
- A-6-7-8-9 is the lowest straight

## Architecture

### Game Engine
The poker engine (`src/engine/`) runs identically on client and server:
- **Deck**: Fisher-Yates shuffle with crypto-quality randomness
- **Hand Evaluator**: Exhaustive 5-card combination evaluation
- **Game State**: Immutable state transitions for each action
- **Tournament**: Blind level management, eliminations, payouts

### Real-time Communication
- Socket.IO handles all real-time game events
- Each player receives a personalized game state (hidden opponent cards)
- Automatic reconnection with state recovery
- Turn timers with server-side enforcement

## License

MIT
