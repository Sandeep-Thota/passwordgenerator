// ==========================================
// PokerZone - Game Room Screen
// ==========================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, BounceIn } from 'react-native-reanimated';
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
import { PlayerAction, GamePhase } from '../../src/engine/types';
import { formatChips } from '../../src/utils/formatters';
import { getHandStrength } from '../../src/engine/hand-evaluator';
import { Modal } from '../../src/components/ui/Modal';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showMenu, setShowMenu] = useState(false);
  const [showAddChips, setShowAddChips] = useState(false);

  const {
    gameState, playerId, chatMessages,
    validActions, minBet, maxBet,
    isChatExpanded, toggleChat, lastWinners,
  } = useGameStore();

  const { playerName, avatar, showHandStrength } = useAuthStore();
  const { sendAction, sitDown, sendChat, sendEmoji, leaveRoom, showCards, addChips } = useSocket();
  const { playSound } = useSound();
  const { trigger: triggerHaptic } = useHaptics();

  const player = gameState?.players.find(p => p.id === playerId);
  const isMyTurn = validActions.length > 0;
  const isSeated = !!player;
  const prevPhaseRef = useRef<GamePhase | null>(null);

  // Sound effects triggered by game phase changes
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
  }, [gameState?.phase]);

  // Sound when it becomes your turn
  useEffect(() => {
    if (isMyTurn) {
      playSound('your-turn');
      triggerHaptic('medium');
    }
  }, [isMyTurn]);

  // Calculate hand strength if enabled
  const handStrengthValue = showHandStrength && player && player.cards.length > 0 && gameState
    ? getHandStrength(player.cards, gameState.communityCards, gameState.variant)
    : null;

  const handleAction = (action: PlayerAction, amount?: number) => {
    // Play appropriate sound for the action
    switch (action) {
      case 'fold': playSound('fold'); triggerHaptic('light'); break;
      case 'check': playSound('check'); triggerHaptic('light'); break;
      case 'call': playSound('chip-bet'); triggerHaptic('medium'); break;
      case 'bet':
      case 'raise': playSound('chip-bet'); triggerHaptic('medium'); break;
      case 'all-in': playSound('all-in'); triggerHaptic('heavy'); break;
    }
    sendAction(action, amount);
  };

  const handleSitDown = (seatIndex: number) => {
    playSound('join');
    triggerHaptic('light');
    sitDown(seatIndex);
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Table',
      'Are you sure you want to leave this table?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            router.back();
          },
        },
      ]
    );
  };

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Connecting to table...</Text>
          <Text style={styles.loadingCode}>Room: {id}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeave} style={styles.backButton}>
          <Text style={styles.backText}>{'< Leave'}</Text>
        </TouchableOpacity>

        <View style={styles.roomInfo}>
          <Text style={styles.roomCode}>Room: {id}</Text>
          <Text style={styles.playerCount}>
            {gameState.players.length} players
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
          {gameState.phase === 'finished' && (
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
        onSend={sendChat}
        onEmojiReaction={sendEmoji}
        isExpanded={isChatExpanded}
        onToggle={toggleChat}
      />

      {/* Menu Modal */}
      <Modal visible={showMenu} onClose={() => setShowMenu(false)} title="Table Options">
        <View style={styles.menuOptions}>
          <TouchableOpacity style={styles.menuOption} onPress={() => {
            setShowMenu(false);
            // Copy room code
          }}>
            <Text style={styles.menuOptionText}>Copy Room Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuOption} onPress={() => {
            setShowMenu(false);
          }}>
            <Text style={styles.menuOptionText}>Hand History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuOption} onPress={() => {
            setShowMenu(false);
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
              onPress={() => {
                addChips(amount);
                setShowAddChips(false);
              }}
            >
              <Text style={styles.addChipText}>+{formatChips(amount)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
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
    fontFamily: 'monospace',
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
