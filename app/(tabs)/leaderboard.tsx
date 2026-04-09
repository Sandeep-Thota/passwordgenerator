// ==========================================
// PokerZone - Leaderboard Screen
// ==========================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { Avatar } from '../../src/components/ui/Avatar';
import { useLeaderboardStore } from '../../src/store/leaderboardStore';

function formatProfit(profit: number): string {
  const prefix = profit >= 0 ? '+' : '';
  return `${prefix}${profit.toLocaleString()}`;
}

function formatWinRate(handsWon: number, handsPlayed: number): string {
  if (handsPlayed === 0) return '0%';
  return `${Math.round((handsWon / handsPlayed) * 100)}%`;
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']; // gold, silver, bronze
const MEDAL_LABELS = ['1st', '2nd', '3rd'];

function TopPlayerCard({ entry, rank }: { entry: any; rank: number }) {
  const medalColor = MEDAL_COLORS[rank] ?? Colors.textMuted;
  const isFirst = rank === 0;

  return (
    <View style={[styles.topCard, isFirst && styles.topCardFirst]}>
      <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
        <Text style={styles.medalText}>{MEDAL_LABELS[rank]}</Text>
      </View>
      <Avatar
        name={entry.playerName}
        avatar={entry.avatar}
        size={isFirst ? 64 : 52}
      />
      <Text style={[styles.topName, isFirst && styles.topNameFirst]} numberOfLines={1}>
        {entry.playerName}
      </Text>
      <Text style={[
        styles.topProfit,
        { color: entry.totalProfit >= 0 ? Colors.success : Colors.danger },
      ]}>
        {formatProfit(entry.totalProfit)}
      </Text>
      <Text style={styles.topStat}>
        {entry.handsPlayed} hands | {formatWinRate(entry.handsWon, entry.handsPlayed)} win
      </Text>
    </View>
  );
}

function PlayerRow({ entry, rank }: { entry: any; rank: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <Avatar name={entry.playerName} avatar={entry.avatar} size={40} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{entry.playerName}</Text>
        <Text style={styles.rowMeta}>
          {entry.handsPlayed} hands | {formatWinRate(entry.handsWon, entry.handsPlayed)} win rate
        </Text>
      </View>
      <Text style={[
        styles.rowProfit,
        { color: entry.totalProfit >= 0 ? Colors.success : Colors.danger },
      ]}>
        {formatProfit(entry.totalProfit)}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏆</Text>
      <Text style={styles.emptyTitle}>No Players Yet</Text>
      <Text style={styles.emptySubtitle}>
        Play some hands to start climbing the ranks!
      </Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const getTopPlayers = useLeaderboardStore((s) => s.getTopPlayers);
  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  const players = getTopPlayers(50);
  const topThree = players.slice(0, 3);
  const rest = players.slice(3);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Force re-render to pick up latest data
    setTick((t) => t + 1);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        {players.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <View style={styles.podiumContainer}>
                {/* Show 2nd, 1st, 3rd order for visual podium effect */}
                {topThree.length >= 2 && (
                  <TopPlayerCard entry={topThree[1]} rank={1} />
                )}
                <TopPlayerCard entry={topThree[0]} rank={0} />
                {topThree.length >= 3 && (
                  <TopPlayerCard entry={topThree[2]} rank={2} />
                )}
              </View>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <View style={styles.listContainer}>
                {rest.map((entry, index) => (
                  <PlayerRow
                    key={entry.playerId}
                    entry={entry}
                    rank={index + 4}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  scrollContent: {
    paddingBottom: Spacing.huge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerEmoji: {
    fontSize: FontSize.xxxl,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 1,
  },

  // Podium / Top 3
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  topCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  topCardFirst: {
    paddingVertical: Spacing.xl,
    borderColor: Colors.borderGold,
    ...Shadows.gold,
  },
  medalBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  medalText: {
    fontSize: FontSize.xs,
    fontWeight: '900',
    color: Colors.bgDarkest,
  },
  topName: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    maxWidth: '100%',
  },
  topNameFirst: {
    fontSize: FontSize.md,
    color: Colors.primary,
  },
  topProfit: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  topStat: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // Player List
  listContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  rankContainer: {
    width: 28,
    alignItems: 'center',
  },
  rankText: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rowMeta: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rowProfit: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge * 2,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
