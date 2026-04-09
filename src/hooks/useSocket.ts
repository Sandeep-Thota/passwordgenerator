// ==========================================
// PokerZone - Socket Hook
// ==========================================

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import {
  RoomConfig, PlayerActionRequest, Room, GameState,
  ChatMessage, PlayerAction,
} from '../engine/types';

const SERVER_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://pokerzone-server.example.com';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setConnected, setCurrentRoom, setGameState,
    addChatMessage, setActionRequired, clearActions,
    setPlayerId, setLastWinners,
  } = useGameStore();

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id || '');
      console.log('Connected to PokerZone server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      clearActions();
      console.log('Disconnected from server');
    });

    socket.on('room:state', (room: Room) => {
      setCurrentRoom(room);
    });

    socket.on('game:state', (state: GameState) => {
      setGameState(state);
      if (state.phase === 'finished' || state.phase === 'waiting') {
        clearActions();
      }
    });

    socket.on('game:action-required', (data: {
      playerId: string;
      validActions: PlayerAction[];
      minBet: number;
      maxBet: number;
      timeLimit: number;
    }) => {
      if (data.playerId === socket.id) {
        setActionRequired(data.validActions, data.minBet, data.maxBet);
      }
    });

    socket.on('game:result', (winners) => {
      setLastWinners(winners);
    });

    socket.on('chat:message', (message: ChatMessage) => {
      addChatMessage(message);
    });

    socket.on('error', (message: string) => {
      console.error('Server error:', message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createRoom = useCallback((config: RoomConfig): Promise<Room> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }
      socketRef.current.emit('room:create', config, (room: Room) => {
        setCurrentRoom(room);
        resolve(room);
      });
    });
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string, avatar: string, buyIn: number): Promise<Room> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Not connected'));
        return;
      }
      socketRef.current.emit('room:join', { roomCode, playerName, avatar, buyIn }, (room: Room | null, error?: string) => {
        if (error || !room) {
          reject(new Error(error || 'Failed to join room'));
          return;
        }
        setCurrentRoom(room);
        resolve(room);
      });
    });
  }, []);

  const sendAction = useCallback((action: PlayerAction, amount?: number) => {
    if (!socketRef.current) return;
    const request: PlayerActionRequest = { action, amount };
    socketRef.current.emit('game:action', request);
    clearActions();
  }, []);

  const sitDown = useCallback((seatIndex: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('game:sit', seatIndex);
  }, []);

  const standUp = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('game:stand');
  }, []);

  const addChips = useCallback((amount: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('game:add-chips', amount);
  }, []);

  const showCards = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('game:show-cards');
  }, []);

  const sendChat = useCallback((message: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:send', message);
  }, []);

  const sendEmoji = useCallback((emoji: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('chat:emoji', emoji);
  }, []);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('room:leave');
    useGameStore.getState().reset();
  }, []);

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    sendAction,
    sitDown,
    standUp,
    addChips,
    showCards,
    sendChat,
    sendEmoji,
    leaveRoom,
  };
}
