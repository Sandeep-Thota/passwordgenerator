// ==========================================
// PokerZone - In-Game Hand History Panel
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { HandRecord, GamePhase, PlayerAction } from '../../engine/types';
import { Colors, BorderRadius, Spacing, FontSize } from '../../constants/theme';
import { SUIT_SYMBOLS } from '../../constants/cards';
import { formatChips, formatTimeAgo } from '../../utils/formatters';
import { Card } from '../../engine/types';

interface HandHistoryPanelProps {
  history: HandRecord[];
  visible: boolean;
  onClose: () => void;
}

function formatCardDisplay(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit] || ''}`;
}

function getActionColor(action: PlayerAction): string {
  switch (action) {
    case 'fold': return Colors.textMuted;
    case 'check': return Colors.info;
    case 'call': return Colors.success;
    case 'bet':
    case 'raise': return Colors.warning;
    case 'all-in': return Colors.danger;
    default: return Colors.textSecondary;
  }
}

function getPhaseLabel(phase: GamePhase): string {
  switch (phase) {
    case 'pre-flop': return 'PRE-FLOP';
    case 'flop': return 'FLOP';
    case 'turn': return 'TURN';
    case 'river': return 'RIVER';
    default: return phase.toUpperCase();
  }
}

export function HandHistoryPanel({ history, visible, onClose }: HandHistoryPanelProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hand History</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...history].reverse()}
        keyExtractor={(item) => `${item.handNumber}-${item.timestamp}`}
        renderItem={({ item }) => (
          <View style={styles.handEntry}>
            <View style={styles.handHeader}>
              <Text style={styles.handNumber}>Hand #{item.handNumber}</Text>
              <Text style={styles.handTime}>{formatTimeAgo(item.timestamp)}</Text>
            </View>

            {/* Board */}
            {item.communityCards.length > 0 && (
              <View style={styles.boardRow}>
                <Text style={styles.boardLabel}>Board: </Text>
                {item.communityCards.map((card, idx) => (
                  <Text
                    key={idx}
                    style={[
                      styles.cardChar,
                      (card.suit === 'hearts' || card.suit === 'diamonds')
                        ? styles.redCard : styles.blackCard,
                    ]}
                  >
                    {formatCardDisplay(card)}{' '}
                  </Text>
                ))}
              </View>
            )}

            {/* Actions */}
            {item.actions.map((action, idx) => (
              <View key={idx} style={styles.actionRow}>
                {idx > 0 && item.actions[idx - 1].phase !== action.phase && (
                  <Text style={styles.phaseLabel}>{getPhaseLabel(action.phase)}</Text>
                )}
                <Text style={styles.actionPlayer}>{action.playerName}</Text>
                <Text style={[styles.actionType, { color: getActionColor(action.action) }]}>
                  {action.action}
                  {action.amount ? ` ${formatChips(action.amount)}` : ''}
                </Text>
              </View>
            ))}

            {/* Result */}
            {item.winners.map((winner, idx) => (
              <View key={idx} style={styles.resultRow}>
                <Text style={styles.resultText}>
                  {winner.playerName} wins {formatChips(winner.amount)}
                  {winner.hand ? ` - ${winner.hand.description}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hands played yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.bgDark,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  closeText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  handEntry: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  handNumber: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  handTime: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  boardLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  cardChar: {
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  redCard: {
    color: Colors.suitRed,
  },
  blackCard: {
    color: Colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  phaseLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  actionPlayer: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    width: 80,
  },
  actionType: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  resultRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resultText: {
    color: Colors.textGold,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  empty: {
    padding: Spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
