// ==========================================
// PokerZone - Room Manager
// ==========================================

import { PokerGame } from '../src/engine/poker-game';
import { Room, RoomConfig, ChatMessage } from '../src/engine/types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private games: Map<string, PokerGame> = new Map();
  private roomsByCode: Map<string, string> = new Map(); // code -> roomId

  createRoom(config: RoomConfig, hostId: string): Room {
    const id = this.generateId();
    const code = this.generateRoomCode();

    const room: Room = {
      id,
      code,
      config,
      hostId,
      createdAt: Date.now(),
      gameState: null,
      chatMessages: [],
      spectators: [],
      handHistory: [],
    };

    const game = new PokerGame(config);
    room.gameState = game.getState();

    this.rooms.set(id, room);
    this.games.set(id, game);
    this.roomsByCode.set(code, id);

    return room;
  }

  joinRoom(
    roomCode: string,
    playerId: string,
    playerName: string,
    avatar: string,
    buyIn: number
  ): { room: Room; seatIndex: number } | null {
    const roomId = this.roomsByCode.get(roomCode.toUpperCase());
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    const game = this.games.get(roomId);
    if (!room || !game) return null;

    // Find first available seat
    const state = game.getState();
    const occupiedSeats = new Set(state.players.map(p => p.seatIndex));
    let seatIndex = -1;
    for (let i = 0; i < room.config.maxPlayers; i++) {
      if (!occupiedSeats.has(i)) {
        seatIndex = i;
        break;
      }
    }

    if (seatIndex === -1) {
      // Add as spectator
      room.spectators.push({ id: playerId, name: playerName });
      return { room, seatIndex: -1 };
    }

    const actualBuyIn = Math.min(
      Math.max(buyIn, room.config.minBuyIn),
      room.config.maxBuyIn
    );

    game.addPlayer(playerId, playerName, avatar, actualBuyIn, seatIndex);
    room.gameState = game.getState();

    return { room, seatIndex };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): Room | undefined {
    const roomId = this.roomsByCode.get(code.toUpperCase());
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getGame(roomId: string): PokerGame | undefined {
    return this.games.get(roomId);
  }

  getRoomState(roomId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    const game = this.games.get(roomId);
    if (room && game) {
      room.gameState = game.getState();
    }
    return room;
  }

  getPublicRooms(): Partial<Room>[] {
    const publicRooms: Partial<Room>[] = [];
    for (const [, room] of this.rooms) {
      if (!room.config.isPrivate) {
        const game = this.games.get(room.id);
        publicRooms.push({
          id: room.id,
          code: room.code,
          config: room.config,
          createdAt: room.createdAt,
          gameState: game ? game.getState() : null,
        });
      }
    }
    return publicRooms;
  }

  addChatMessage(roomId: string, message: ChatMessage): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.chatMessages.push(message);
      // Keep last 200 messages
      if (room.chatMessages.length > 200) {
        room.chatMessages = room.chatMessages.slice(-200);
      }
    }
  }

  cleanupRoom(roomId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;

    const state = game.getState();
    const connectedPlayers = state.players.filter(p => p.isConnected);

    if (connectedPlayers.length === 0) {
      const room = this.rooms.get(roomId);
      if (room) {
        this.roomsByCode.delete(room.code);
      }
      this.rooms.delete(roomId);
      this.games.delete(roomId);
      console.log(`Room ${roomId} cleaned up (empty)`);
    }
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getPlayerCount(): number {
    let count = 0;
    for (const [, game] of this.games) {
      count += game.getState().players.length;
    }
    return count;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (this.roomsByCode.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}
