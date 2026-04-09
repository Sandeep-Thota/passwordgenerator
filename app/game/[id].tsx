// ==========================================
// PokerZone - Game Room Screen
// ==========================================
// Supports both online (socket) and offline (bot) modes

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Animated, { BounceIn } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../src/constants/theme';
import { PokerTable } from '../../src/components/game/PokerTable';
import { ActionPanel } from '../../src/components/game/ActionPanel';
import { ChatPanel } from '../../src/components/chat/ChatPanel';
import { useGameStore } from '../../src/store/gameStore';
import { useAuthStore } from '../../src/store/authStore';
import { useSocket } from '../../src/hooks/useSocket';
import { useSound } from '../../src/hooks/useSound';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import { useNotifications } from '../../src/hooks/useNotifications';
import {
  PlayerAction, GamePhase, GameState, ChatMessage,
  PlayerActionRequest, GameVariant,
} from '../../src/engine/types';
import { formatChips } from '../../src/utils/formatters';
import { getHandStrength } from '../../src/engine/hand-evaluator';
import { Modal } from '../../src/components/ui/Modal';
import { OfflineGameManager } from '../../src/engine/offline-game';
import { BotDifficulty } from '../../src/engine/bot';
import { Ledger, buildLedgerEntries } from '../../src/components/game/Ledger';

export default function GameScreen() {
  const params = useLocalSearchParams<{
    id: string;
    mode?: string;
    variant?: string;
    difficulty?: string;
    numBots?: string;
    smallBlind?: string;
    bigBlind?: string;
  }>();

  const isOffline = params.mode === 'offline' || params.id === 'solo';

  // ==========================================
  // Shared UI state
  // ==========================================
  const [showMenu, setShowMenu] = useState(false);
  const [showAddChips, setShowAddChips] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const buyInTracker = useRef(new Map<string, { count: number; total: number }>());

  // Offline-specific local state
  const [offlineGameState, setOfflineGameState] = useState<GameState | null>(null);
  const [offlinePlayerId, setOfflinePlayerId] = useState('');
  const [offlineValidActions, setOfflineValidActions] = useState<PlayerAction[]>([]);
  const [offlineMinBet, setOfflineMinBet] = useState(0);
  const [offlineMaxBet, setOfflineMaxBet] = useState(0);
  const [offlineWinners, setOfflineWinners] = useState<{ playerId: string; amount: number; hand?: any }[]>([]);
  const [offlineChatMessages, setOfflineChatMessages] = useState<ChatMessage[]>([]);
  const offlineManagerRef = useRef<OfflineGameManager | null>(null);

  // Online state from stores
  const storeState = useGameStore();
  const { playerName, avatar, showHandStrength } = useAuthStore();
  const { sendAction, sitDown, sendChat, sendEmoji, leaveRoom, showCards, addChips: addChipsOnline } = useSocket();
  const { playSound } = useSound();
  const { trigger: triggerHaptic } = useHaptics();
  const { notifyYourTurn, notifyWin } = useNotifications();

  // Resolve state based on mode
  const gameState = isOffline ? offlineGameState : storeState.gameState;
  const playerId = isOffline ? offlinePlayerId : storeState.playerId;
  const validActions = isOffline ? offlineValidActions : storeState.validActions;
  const minBet = isOffline ? offlineMinBet : storeState.minBet;
  const maxBet = isOffline ? offlineMaxBet : storeState.maxBet;
  const lastWinners = isOffline ? offlineWinners : storeState.lastWinners;
  const chatMessages = isOffline ? offlineChatMessages : storeState.chatMessages;

  const player = gameState?.players.find(p => p.id === playerId);
  const isMyTurn = validActions.length > 0;
  const prevPhaseRef = useRef<GamePhase | null>(null);

  // ==========================================
  // Offline mode setup
  // ==========================================
  useEffect(() => {
    if (!isOffline) return;

    const manager = new OfflineGameManager(
      {
        playerName: playerName || 'Player',
        playerAvatar: avatar || 'ace',
        numberOfBots: parseInt(params.numBots || '5'),
        botDifficulty: (params.difficulty as BotDifficulty) || 'medium',
        startingChips: 1000,
        smallBlind: parseInt(params.smallBlind || '1'),
        bigBlind: parseInt(params.bigBlind || '2'),
        variant: (params.variant as GameVariant) || 'texas-holdem',
        autoStartNextHand: true,
        nextHandDelay: 3500,
      },
      {
        onStateChange: (state) => {
          setOfflineGameState(state);
        },
        onPlayerTurnStart: (actions, min, max) => {
          setOfflineValidActions(actions);
          setOfflineMinBet(min);
          setOfflineMaxBet(max);
        },
        onBotAction: (botId, botName, action) => {
          // Add bot action as a chat message for visibility
          const actionText = action.amount
            ? `${action.action} ${formatChips(action.amount)}`
            : action.action;
          setOfflineChatMessages(prev => [...prev.slice(-99), {
            id: Math.random().toString(36).substring(2),
            playerId: botId,
            playerName: botName,
            message: actionText,
            timestamp: Date.now(),
            type: 'system' as const,
          }]);
        },
        onHandComplete: (record) => {
          // Set winners for display
          setOfflineWinners(record.winners.map(w => ({
            playerId: w.playerId,
            amount: w.amount,
            hand: w.hand,
          })));
          // Clear valid actions
          setOfflineValidActions([]);

          // Add to persisted hand history
          useGameStore.getState().addHandRecord(record);
        },
        onGameStart: (state) => {
          // Track initial buy-ins for all players
          for (const p of state.players) {
            buyInTracker.current.set(p.id, { count: 1, total: p.chips });
          }

          const systemMsg: ChatMessage = {
            id: 'start',
            playerId: 'system',
            playerName: 'System',
            message: 'Game started! Good luck!',
            timestamp: Date.now(),
            type: 'system',
          };
          setOfflineChatMessages([systemMsg]);
        },
        onError: (message) => {
          Alert.alert('Game', message);
        },
      }
    );

    offlineManagerRef.current = manager;
    setOfflinePlayerId(manager.getHumanPlayerId());

    // Start the game after a short delay for the UI to render
    const startTimer = setTimeout(() => {
      manager.startGame();
    }, 500);

    return () => {
      clearTimeout(startTimer);
      manager.destroy();
      offlineManagerRef.current = null;
    };
  }, [isOffline]);

  // ==========================================
  // Sound effects triggered by game phase changes
  // ==========================================
  useEffect(() => {
    if (!gameState) return;
    const prevPhase = prevPhaseRef.current;
    const phase = gameState.phase;
    prevPhaseRef.current = phase;

    if (prevPhase === phase) return;

    if (phase === 'pre-flop' && prevPhase !== 'pre-flop') {
      playSound('card-deal');
    } else if (phase === 'flop' || phase === 'turn' || phase === 'river') {
      playSound('card-flip');
    } else if (phase === 'showdown' || phase === 'finished') {
      if (lastWinners.some(w => w.playerId === playerId)) {
        playSound('chip-win');
        triggerHaptic('success');
      }
    }

    // Clear winners when a new hand starts
    if (phase === 'pre-flop' && prevPhase === 'finished') {
      if (isOffline) setOfflineWinners([]);
    }
  }, [gameState?.phase]);

  // Sound + notification when it becomes your turn
  useEffect(() => {
    if (isMyTurn) {
      playSound('your-turn');
      triggerHaptic('medium');
      notifyYourTurn();
    }
  }, [isMyTurn]);

  // Notification when you win
  useEffect(() => {
    if (lastWinners.length > 0) {
      const myWin = lastWinners.find(w => w.playerId === playerId);
      if (myWin) {
        notifyWin(formatChips(myWin.amount));
      }
    }
  }, [lastWinners]);

  // ==========================================
  // Action handlers
  // ==========================================
  const handleAction = useCallback((action: PlayerAction, amount?: number) => {
    switch (action) {
      case 'fold': playSound('fold'); triggerHaptic('light'); break;
      case 'check': playSound('check'); triggerHaptic('light'); break;
      case 'call': playSound('chip-bet'); triggerHaptic('medium'); break;
      case 'bet':
      case 'raise': playSound('chip-bet'); triggerHaptic('medium'); break;
      case 'all-in': playSound('all-in'); triggerHaptic('heavy'); break;
    }

    if (isOffline) {
      const request: PlayerActionRequest = { action, amount };
      offlineManagerRef.current?.processPlayerAction(request);
      setOfflineValidActions([]);
    } else {
      sendAction(action, amount);
    }
  }, [isOffline]);

  useKeyboardShortcuts({
    validActions,
    onAction: handleAction,
    minBet,
    maxBet,
    enabled: isMyTurn,
  });

  const handleSitDown = useCallback((seatIndex: number) => {
    if (!isOffline) {
      playSound('join');
      triggerHaptic('light');
      sitDown(seatIndex);
    }
  }, [isOffline]);

  const handleLeave = () => {
    Alert.alert(
      'Leave Table',
      'Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            if (isOffline) {
              offlineManagerRef.current?.destroy();
            } else {
              leaveRoom();
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleAddChips = useCallback((amount: number) => {
    // Track buy-in before adding chips
    const existing = buyInTracker.current.get(playerId) || { count: 0, total: 0 };
    buyInTracker.current.set(playerId, { count: existing.count + 1, total: existing.total + amount });

    if (isOffline) {
      offlineManagerRef.current?.addChips(amount);
    } else {
      addChipsOnline(amount);
    }
    setShowAddChips(false);
  }, [isOffline, playerId]);

  const handleSendChat = useCallback((message: string) => {
    if (isOffline) {
      setOfflineChatMessages(prev => [...prev.slice(-99), {
        id: Math.random().toString(36).substring(2),
        playerId,
        playerName: playerName || 'You',
        message,
        timestamp: Date.now(),
        type: 'chat' as const,
      }]);
    } else {
      sendChat(message);
    }
  }, [isOffline, playerId, playerName]);

  const handleSendEmoji = useCallback((emoji: string) => {
    if (isOffline) {
      setOfflineChatMessages(prev => [...prev.slice(-99), {
        id: Math.random().toString(36).substring(2),
        playerId,
        playerName: playerName || 'You',
        message: emoji,
        timestamp: Date.now(),
        type: 'emoji-reaction' as const,
      }]);
    } else {
      sendEmoji(emoji);
    }
  }, [isOffline, playerId, playerName]);

  // ==========================================
  // Derived state
  // ==========================================
  const handStrengthValue = showHandStrength && player && player.cards.length > 0 && gameState
    ? getHandStrength(player.cards, gameState.communityCards, gameState.variant)
    : null;

  const isChatExpanded = isOffline ? false : storeState.isChatExpanded;
  const toggleChat = isOffline
    ? () => {}
    : storeState.toggleChat;

  const modeLabel = isOffline ? 'Solo Practice' : `Room: ${params.id}`;

  // ==========================================
  // Loading state
  // ==========================================
  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingEmoji}>🃏</Text>
          <Text style={styles.loadingText}>
            {isOffline ? 'Setting up table...' : 'Connecting to table...'}
          </Text>
          <Text style={styles.loadingCode}>{modeLabel}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // Render
  // ==========================================
  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
          <Text style={styles.backText}>{'< Leave'}</Text>
        </TouchableOpacity>

        <View style={styles.roomInfo}>
          <Text style={styles.roomCode}>{modeLabel}</Text>
          <Text style={styles.playerCount}>
            {gameState.players.length} players
            {isOffline ? ` | Hand #${gameState.handNumber}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={styles.menuButton}
        >
          <Text style={styles.menuDots}>...</Text>
        </TouchableOpacity>
      </View>

      {/* Game table */}
      <View style={styles.tableArea}>
        <PokerTable
          gameState={gameState}
          heroPlayerId={playerId}
          onSitDown={handleSitDown}
        />
      </View>

      {/* Hand strength indicator */}
      {handStrengthValue !== null && (
        <View style={styles.handStrength}>
          <Text style={styles.handStrengthLabel}>Hand Strength</Text>
          <View style={styles.handStrengthBar}>
            <View
              style={[
                styles.handStrengthFill,
                {
                  width: `${handStrengthValue}%`,
                  backgroundColor: handStrengthValue > 70 ? Colors.success
                    : handStrengthValue > 40 ? Colors.warning
                    : Colors.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.handStrengthValue}>{handStrengthValue}%</Text>
        </View>
      )}

      {/* Player's chip count when seated */}
      {player && (
        <View style={styles.heroInfo}>
          <View style={styles.heroChips}>
            <Text style={styles.heroChipsLabel}>Your Stack</Text>
            <Text style={styles.heroChipsValue}>{formatChips(player.chips)}</Text>
          </View>
          {gameState.phase === 'finished' && !isOffline && (
            <TouchableOpacity
              style={styles.showCardsButton}
              onPress={showCards}
            >
              <Text style={styles.showCardsText}>Show Cards</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addChipsButton}
            onPress={() => setShowAddChips(true)}
          >
            <Text style={styles.addChipsText}>+ Chips</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Winner announcement */}
      {lastWinners.length > 0 && gameState.phase === 'finished' && (
        <Animated.View entering={BounceIn.duration(500)} style={styles.winnerAnnouncement}>
          {lastWinners.map((winner, idx) => {
            const winnerPlayer = gameState.players.find(p => p.id === winner.playerId);
            return (
              <Text key={idx} style={styles.winnerText}>
                🏆 {winnerPlayer?.name || 'Player'} wins {formatChips(winner.amount)}
                {winner.hand ? ` with ${winner.hand.description}` : ''}
              </Text>
            );
          })}
        </Animated.View>
      )}

      {/* Action panel (when it's player's turn) */}
      {isMyTurn && gameState && (
        <ActionPanel
          gameState={gameState}
          playerId={playerId}
          validActions={validActions}
          minBet={minBet}
          maxBet={maxBet}
          onAction={handleAction}
        />
      )}

      {/* Chat */}
      <ChatPanel
        messages={chatMessages}
        onSend={handleSendChat}
        onEmojiReaction={handleSendEmoji}
        isExpanded={isChatExpanded}
        onToggle={toggleChat}
      />

      {/* Menu Modal */}
      <Modal visible={showMenu} onClose={() => setShowMenu(false)} title="Table Options">
        <View style={styles.menuOptions}>
          {!isOffline && (
            <TouchableOpacity style={styles.menuOption} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuOptionText}>Copy Room Code</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuOption} onPress={() => setShowMenu(false)}>
            <Text style={styles.menuOptionText}>Hand History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuOption} onPress={() => {
            setShowMenu(false);
            setShowLedger(true);
          }}>
            <Text style={styles.menuOptionText}>Table Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuOption, styles.menuOptionDanger]} onPress={() => {
            setShowMenu(false);
            handleLeave();
          }}>
            <Text style={styles.menuOptionDangerText}>Leave Table</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Add Chips Modal */}
      <Modal visible={showAddChips} onClose={() => setShowAddChips(false)} title="Add Chips">
        <View style={styles.addChipsOptions}>
          {[100, 500, 1000, 2000, 5000].map(amount => (
            <TouchableOpacity
              key={amount}
              style={styles.addChipOption}
              onPress={() => handleAddChips(amount)}
            >
              <Text style={styles.addChipText}>+{formatChips(amount)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      {showLedger && gameState && (
        <View style={StyleSheet.absoluteFill}>
          <Ledger
            entries={buildLedgerEntries(
              gameState.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, chips: p.chips })),
              storeState.handHistory,
              buyInTracker.current,
            )}
            onClose={() => setShowLedger(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  loadingCode: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  roomInfo: {
    alignItems: 'center',
  },
  roomCode: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  playerCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  menuButton: {
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.md,
  },
  menuDots: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  handStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.bgDark,
  },
  handStrengthLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  handStrengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bgLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  handStrengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  handStrengthValue: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    width: 35,
    textAlign: 'right',
  },
  heroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    backgroundColor: Colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  heroChips: {
    flex: 1,
  },
  heroChipsLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  heroChipsValue: {
    color: Colors.textGold,
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  showCardsButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  showCardsText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  addChipsButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  addChipsText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  winnerAnnouncement: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderGold,
  },
  winnerText: {
    color: Colors.textGold,
    fontSize: FontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuOptions: {
    gap: Spacing.sm,
  },
  menuOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgLight,
  },
  menuOptionText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  menuOptionDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  menuOptionDangerText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  addChipsOptions: {
    gap: Spacing.sm,
  },
  addChipOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  addChipText: {
    color: Colors.textGold,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
});
