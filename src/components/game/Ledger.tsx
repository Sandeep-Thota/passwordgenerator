// ==========================================
// PokerZone - Ledger / Standings Component
// ==========================================
// Shows buy-in tracking, profit/loss, and player standings

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LedgerEntry } from '../../engine/types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { formatChips } from '../../utils/formatters';

interface LedgerProps {
  entries: LedgerEntry[];
  onClose: () => void;
}

export function Ledger({ entries, onClose }: LedgerProps) {
  // Sort by net profit descending
  const sorted = [...entries].sort((a, b) => b.netProfit - a.netProfit);

  const totalBuyIns = entries.reduce((sum, e) => sum + e.totalBuyIn, 0);
  const totalInPlay = entries.reduce((sum, e) => sum + e.cashOut, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Table Ledger</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{entries.length}</Text>
          <Text style={styles.summaryLabel}>Players</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatChips(totalBuyIns)}</Text>
          <Text style={styles.summaryLabel}>Total Buy-ins</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatChips(totalInPlay)}</Text>
          <Text style={styles.summaryLabel}>In Play</Text>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Column headers */}
        <View style={styles.columnHeaders}>
          <Text style={[styles.colHeader, { flex: 2 }]}>Player</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Buy-ins</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Bought</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Stack</Text>
          <Text style={[styles.colHeader, { flex: 1, textAlign: 'right' }]}>Profit</Text>
        </View>

        {/* Player rows */}
        {sorted.map((entry, index) => {
          const isPositive = entry.netProfit > 0;
          const isNegative = entry.netProfit < 0;
          const isEven = entry.netProfit === 0;

          return (
            <Animated.View
              key={entry.playerId}
              entering={FadeInUp.duration(200).delay(index * 60)}
              style={[
                styles.row,
                index === 0 && styles.rowFirst,
                index === sorted.length - 1 && styles.rowLast,
              ]}
            >
              {/* Rank */}
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </Text>
              </View>

              {/* Player info */}
              <View style={styles.playerInfo}>
                <Avatar name={entry.playerName} avatar={entry.avatar} size={32} />
                <View style={styles.playerDetails}>
                  <Text style={styles.playerName} numberOfLines={1}>{entry.playerName}</Text>
                  <Text style={styles.playerStats}>
                    {entry.handsWon}/{entry.handsPlayed} hands won
                  </Text>
                </View>
              </View>

              {/* Buy-in count */}
              <Text style={styles.buyInCount}>{entry.buyIns}x</Text>

              {/* Total bought */}
              <Text style={styles.bought}>{formatChips(entry.totalBuyIn)}</Text>

              {/* Current stack */}
              <Text style={styles.stack}>{formatChips(entry.cashOut)}</Text>

              {/* Net profit */}
              <View style={[
                styles.profitBadge,
                isPositive && styles.profitPositive,
                isNegative && styles.profitNegative,
                isEven && styles.profitEven,
              ]}>
                <Text style={[
                  styles.profitText,
                  isPositive && styles.profitTextPositive,
                  isNegative && styles.profitTextNegative,
                ]}>
                  {isPositive ? '+' : ''}{formatChips(entry.netProfit)}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendText}>Winning</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
            <Text style={styles.legendText}>Losing</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.textMuted }]} />
            <Text style={styles.legendText}>Even</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper to build ledger entries from game state and history
export function buildLedgerEntries(
  players: { id: string; name: string; avatar: string; chips: number }[],
  handHistory: { winners: { playerId: string; amount: number }[]; players: { id: string }[] }[],
  buyInTracker: Map<string, { count: number; total: number }>,
): LedgerEntry[] {
  return players.map(player => {
    const buyInInfo = buyInTracker.get(player.id) || { count: 1, total: 1000 };
    const handsPlayed = handHistory.filter(h => h.players.some(p => p.id === player.id)).length;
    const handsWon = handHistory.filter(h => h.winners.some(w => w.playerId === player.id)).length;
    const biggestPot = handHistory
      .filter(h => h.winners.some(w => w.playerId === player.id))
      .reduce((max, h) => {
        const win = h.winners.find(w => w.playerId === player.id);
        return Math.max(max, win?.amount || 0);
      }, 0);

    return {
      playerId: player.id,
      playerName: player.name,
      avatar: player.avatar,
      buyIns: buyInInfo.count,
      totalBuyIn: buyInInfo.total,
      cashOut: player.chips,
      netProfit: player.chips - buyInInfo.total,
      handsPlayed,
      handsWon,
      biggestPot,
    };
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    paddingVertical: Spacing.xs,
    width: 60,
  },
  closeText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.bgMedium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  colHeader: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMedium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomWidth: 0,
  },
  rowFirst: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  rowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  rankBadge: {
    width: 28,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
  },
  playerInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  playerStats: {
    color: Colors.textMuted,
    fontSize: 9,
  },
  buyInCount: {
    flex: 0.5,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  bought: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  stack: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  profitBadge: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: 3,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  profitPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  profitNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  profitEven: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
  },
  profitText: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  profitTextPositive: {
    color: Colors.success,
  },
  profitTextNegative: {
    color: Colors.danger,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
