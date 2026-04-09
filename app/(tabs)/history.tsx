// ==========================================
// PokerZone - Hand History Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../src/constants/theme';
import { useGameStore } from '../../src/store/gameStore';
import { formatChips, formatTimeAgo } from '../../src/utils/formatters';
import { SUIT_SYMBOLS } from '../../src/constants/cards';
import { Card, HandRecord } from '../../src/engine/types';
import { HandReplay } from '../../src/components/game/HandReplay';

function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit] || ''}`;
}

export default function HistoryScreen() {
  const { handHistory } = useGameStore();
  const [replayHand, setReplayHand] = useState<HandRecord | null>(null);

  // Show replay viewer
  if (replayHand) {
    return <HandReplay hand={replayHand} onClose={() => setReplayHand(null)} />;
  }

  if (handHistory.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Hand History</Text>
          <Text style={styles.emptySubtitle}>
            Your played hands will appear here.{'\n'}
            Join a table or start a solo game to begin!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...handHistory].reverse()}
        keyExtractor={(item) => `hand-${item.handNumber}-${item.timestamp}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.handCard}
            onPress={() => setReplayHand(item)}
            activeOpacity={0.7}
          >
            <View style={styles.handHeader}>
              <Text style={styles.handNumber}>Hand #{item.handNumber}</Text>
              <View style={styles.replayBadge}>
                <Text style={styles.replayBadgeText}>▶ Replay</Text>
              </View>
              <Text style={styles.handTime}>{formatTimeAgo(item.timestamp)}</Text>
            </View>

            {/* Community cards */}
            <View style={styles.communityRow}>
              <Text style={styles.communityLabel}>Board: </Text>
              {item.communityCards.map((card, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.cardText,
                    (card.suit === 'hearts' || card.suit === 'diamonds') ? styles.cardRed : styles.cardBlack,
                  ]}
                >
                  {formatCard(card)}{' '}
                </Text>
              ))}
              {item.communityCards.length === 0 && (
                <Text style={styles.noBoard}>No board (won pre-flop)</Text>
              )}
            </View>

            {/* Winners */}
            {item.winners.map((winner, idx) => (
              <View key={idx} style={styles.winnerRow}>
                <Text style={styles.winnerName}>
                  🏆 {winner.playerName}
                </Text>
                <Text style={styles.winnerAmount}>
                  +{formatChips(winner.amount)}
                </Text>
                {winner.hand && (
                  <Text style={styles.winnerHand}>{winner.hand.description}</Text>
                )}
              </View>
            ))}

            {/* Actions summary */}
            <View style={styles.actionsSummary}>
              <Text style={styles.actionsLabel}>
                {item.players.length} players | {item.actions.length} actions | Tap to replay
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  handCard: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  handHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  handNumber: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  replayBadge: {
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  replayBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  handTime: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  communityLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  noBoard: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  cardText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  cardRed: {
    color: Colors.suitRed,
  },
  cardBlack: {
    color: Colors.textPrimary,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  winnerName: {
    color: Colors.textGold,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  winnerAmount: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  winnerHand: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
  actionsSummary: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionsLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
