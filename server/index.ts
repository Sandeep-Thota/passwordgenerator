// ==========================================
// PokerZone - Game Server
// ==========================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager';
import { RoomConfig, PlayerActionRequest, ChatMessage } from '../src/engine/types';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const roomManager = new RoomManager();

// REST endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: roomManager.getRoomCount(), players: roomManager.getPlayerCount() });
});

app.get('/api/rooms', (_req, res) => {
  const rooms = roomManager.getPublicRooms();
  res.json(rooms);
});

app.get('/api/room/:code', (req, res) => {
  const room = roomManager.getRoomByCode(req.params.code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    id: room.id,
    code: room.code,
    name: room.config.name,
    variant: room.config.variant,
    playerCount: room.gameState?.players.length || 0,
    maxPlayers: room.config.maxPlayers,
    blinds: `${room.config.smallBlind}/${room.config.bigBlind}`,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  let currentRoomId: string | null = null;
  let playerName: string = '';
  let playerAvatar: string = '';

  // Create a room
  socket.on('room:create', (config: RoomConfig, callback) => {
    try {
      const room = roomManager.createRoom(config, socket.id);
      currentRoomId = room.id;
      socket.join(room.id);
      callback(room);
      console.log(`Room created: ${room.code} by ${socket.id}`);
    } catch (error: any) {
      socket.emit('error', error.message);
    }
  });

  // Join a room
  socket.on('room:join', (data, callback) => {
    try {
      const { roomCode, playerName: name, avatar, buyIn } = data;
      playerName = name;
      playerAvatar = avatar;

      const result = roomManager.joinRoom(roomCode, socket.id, name, avatar, buyIn);
      if (!result) {
        callback(null, 'Room not found or full');
        return;
      }

      currentRoomId = result.room.id;
      socket.join(result.room.id);

      // Notify all players in the room
      io.to(result.room.id).emit('room:state', roomManager.getRoomState(result.room.id));
      io.to(result.room.id).emit('room:player-joined', { id: socket.id, name, avatar });

      // Send system chat message
      const joinMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2),
        playerId: 'system',
        playerName: 'System',
        message: `${name} joined the table`,
        timestamp: Date.now(),
        type: 'system',
      };
      roomManager.addChatMessage(result.room.id, joinMsg);
      io.to(result.room.id).emit('chat:message', joinMsg);

      callback(result.room);
      console.log(`${name} joined room ${roomCode}`);

      // Auto-start if enough players
      const room = roomManager.getRoom(result.room.id);
      if (room && room.config.autoStart) {
        const game = roomManager.getGame(result.room.id);
        if (game && game.canStartHand() && !game.isHandInProgress()) {
          setTimeout(() => {
            startNewHand(result.room.id);
          }, 3000);
        }
      }
    } catch (error: any) {
      callback(null, error.message);
    }
  });

  // Sit at a specific seat
  socket.on('game:sit', (seatIndex: number) => {
    if (!currentRoomId) return;
    const room = roomManager.getRoom(currentRoomId);
    if (!room) return;

    const game = roomManager.getGame(currentRoomId);
    if (!game) return;

    const buyIn = room.config.minBuyIn;
    const success = game.addPlayer(socket.id, playerName, playerAvatar, buyIn, seatIndex);
    if (success) {
      io.to(currentRoomId).emit('game:state', game.getState());

      // Auto-start check
      if (room.config.autoStart && game.canStartHand() && !game.isHandInProgress()) {
        setTimeout(() => {
          startNewHand(currentRoomId!);
        }, 3000);
      }
    }
  });

  // Player action (fold, call, raise, etc.)
  socket.on('game:action', (action: PlayerActionRequest) => {
    if (!currentRoomId) return;
    const game = roomManager.getGame(currentRoomId);
    if (!game) return;

    const success = game.processAction(socket.id, action);
    if (success) {
      // Send updated state to all players
      const state = game.getState();
      for (const player of state.players) {
        const playerSocket = io.sockets.sockets.get(player.id);
        if (playerSocket) {
          playerSocket.emit('game:state', game.getStateForPlayer(player.id));
        }
      }

      // Broadcast to spectators
      socket.to(currentRoomId).emit('game:state', game.getStateForPlayer('spectator'));

      // If hand is finished, send results and start new hand
      if (state.phase === 'finished') {
        io.to(currentRoomId).emit('game:result', state.winners);

        // Auto-start next hand after delay
        setTimeout(() => {
          if (currentRoomId) {
            startNewHand(currentRoomId);
          }
        }, 5000);
      }

      // Send action required to next player
      const currentPlayerId = game.getCurrentPlayerId();
      if (currentPlayerId) {
        const validActions = game.getValidActions(currentPlayerId);
        const currentPlayerSocket = io.sockets.sockets.get(currentPlayerId);
        if (currentPlayerSocket) {
          currentPlayerSocket.emit('game:action-required', {
            playerId: currentPlayerId,
            validActions: validActions.actions,
            minBet: validActions.minBet,
            maxBet: validActions.maxBet,
            timeLimit: state.turnTimeLimit,
          });
        }
      }
    }
  });

  // Add chips
  socket.on('game:add-chips', (amount: number) => {
    if (!currentRoomId) return;
    const game = roomManager.getGame(currentRoomId);
    if (game) {
      game.addChips(socket.id, amount);
      io.to(currentRoomId).emit('game:state', game.getState());
    }
  });

  // Show cards voluntarily
  socket.on('game:show-cards', () => {
    if (!currentRoomId) return;
    const game = roomManager.getGame(currentRoomId);
    if (game) {
      game.showCards(socket.id);
      io.to(currentRoomId).emit('game:state', game.getState());
    }
  });

  // Sit out
  socket.on('game:stand', () => {
    if (!currentRoomId) return;
    const game = roomManager.getGame(currentRoomId);
    if (game) {
      game.sitOut(socket.id);
      io.to(currentRoomId).emit('game:state', game.getState());
    }
  });

  // Chat
  socket.on('chat:send', (message: string) => {
    if (!currentRoomId) return;
    const chatMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      playerId: socket.id,
      playerName: playerName || 'Anonymous',
      message: message.slice(0, 500), // Limit message length
      timestamp: Date.now(),
      type: 'chat',
    };
    roomManager.addChatMessage(currentRoomId, chatMsg);
    io.to(currentRoomId).emit('chat:message', chatMsg);
  });

  // Emoji reaction
  socket.on('chat:emoji', (emoji: string) => {
    if (!currentRoomId) return;
    const chatMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      playerId: socket.id,
      playerName: playerName || 'Anonymous',
      message: emoji,
      timestamp: Date.now(),
      type: 'emoji-reaction',
    };
    io.to(currentRoomId).emit('chat:message', chatMsg);
  });

  // Leave room
  socket.on('room:leave', () => {
    handleDisconnect();
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    handleDisconnect();
  });

  function handleDisconnect() {
    if (!currentRoomId) return;

    const game = roomManager.getGame(currentRoomId);
    if (game) {
      game.removePlayer(socket.id);
      io.to(currentRoomId).emit('game:state', game.getState());
    }

    const leaveMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2),
      playerId: 'system',
      playerName: 'System',
      message: `${playerName || 'A player'} left the table`,
      timestamp: Date.now(),
      type: 'system',
    };
    roomManager.addChatMessage(currentRoomId, leaveMsg);
    io.to(currentRoomId).emit('chat:message', leaveMsg);
    io.to(currentRoomId).emit('room:player-left', socket.id);

    socket.leave(currentRoomId);

    // Clean up empty rooms
    roomManager.cleanupRoom(currentRoomId);
    currentRoomId = null;
  }

  function startNewHand(roomId: string) {
    const game = roomManager.getGame(roomId);
    if (!game || !game.canStartHand()) return;

    const started = game.startHand();
    if (!started) return;

    const state = game.getState();

    // Send personalized state to each player
    for (const player of state.players) {
      const playerSocket = io.sockets.sockets.get(player.id);
      if (playerSocket) {
        playerSocket.emit('game:state', game.getStateForPlayer(player.id));
      }
    }

    // Send action-required to first player
    const currentPlayerId = game.getCurrentPlayerId();
    if (currentPlayerId) {
      const validActions = game.getValidActions(currentPlayerId);
      const currentPlayerSocket = io.sockets.sockets.get(currentPlayerId);
      if (currentPlayerSocket) {
        currentPlayerSocket.emit('game:action-required', {
          playerId: currentPlayerId,
          validActions: validActions.actions,
          minBet: validActions.minBet,
          maxBet: validActions.maxBet,
          timeLimit: state.turnTimeLimit,
        });
      }
    }

    // Set up turn timer
    setupTurnTimer(roomId);
  }

  function setupTurnTimer(roomId: string) {
    const game = roomManager.getGame(roomId);
    if (!game) return;

    const state = game.getState();
    if (state.phase === 'waiting' || state.phase === 'finished') return;

    const currentPlayerId = game.getCurrentPlayerId();
    if (!currentPlayerId) return;

    // Auto-fold after time limit
    setTimeout(() => {
      const currentGame = roomManager.getGame(roomId);
      if (!currentGame) return;
      const currentState = currentGame.getState();
      if (currentState.phase === 'waiting' || currentState.phase === 'finished') return;

      const nowCurrentId = currentGame.getCurrentPlayerId();
      if (nowCurrentId === currentPlayerId) {
        // Player timed out - auto fold
        currentGame.autoFold(currentPlayerId);
        const updatedState = currentGame.getState();

        for (const player of updatedState.players) {
          const pSocket = io.sockets.sockets.get(player.id);
          if (pSocket) {
            pSocket.emit('game:state', currentGame.getStateForPlayer(player.id));
          }
        }

        if (updatedState.phase === 'finished') {
          io.to(roomId).emit('game:result', updatedState.winners);
          setTimeout(() => startNewHand(roomId), 5000);
        } else {
          setupTurnTimer(roomId);
        }
      }
    }, (state.turnTimeLimit + 5) * 1000); // Extra 5 seconds grace
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`
  ♠️ ♥️ ♦️ ♣️  PokerZone Server  ♣️ ♦️ ♥️ ♠️

  Server running on port ${PORT}
  WebSocket ready for connections
  `);
});

export { io, httpServer };
