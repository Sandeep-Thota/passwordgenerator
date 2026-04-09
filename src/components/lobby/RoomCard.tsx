// ==========================================
// PokerZone - Room Card Component (Lobby)
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { formatBlinds, formatTimeAgo } from '../../utils/formatters';

interface RoomCardProps {
  name: string;
  variant: string;
  playerCount: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  code: string;
  createdAt: number;
  onJoin: () => void;
}

export function RoomCard({
  name,
  variant,
  playerCount,
  maxPlayers,
  smallBlind,
  bigBlind,
  code,
  createdAt,
  onJoin,
}: RoomCardProps) {
  const isFull = playerCount >= maxPlayers;
  const variantLabel = getVariantLabel(variant);

  return (
    <TouchableOpacity
      style={[styles.card, isFull && styles.cardFull]}
      onPress={onJoin}
      disabled={isFull}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.variantBadge}>
            <Text style={styles.variantText}>{variantLabel}</Text>
          </View>
        </View>
        <Text style={styles.code}>{code}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Blinds</Text>
          <Text style={styles.detailValue}>{formatBlinds(smallBlind, bigBlind)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Players</Text>
          <Text style={[styles.detailValue, isFull && styles.fullText]}>
            {playerCount}/{maxPlayers}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{formatTimeAgo(createdAt)}</Text>
        </View>
      </View>

      {/* Player count bar */}
      <View style={styles.playerBar}>
        <View style={[styles.playerBarFill, { width: `${(playerCount / maxPlayers) * 100}%` }]} />
      </View>

      {isFull && (
        <View style={styles.fullOverlay}>
          <Text style={styles.fullLabel}>TABLE FULL</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getVariantLabel(variant: string): string {
  switch (variant) {
    case 'texas-holdem': return "Hold'em";
    case 'omaha': return 'Omaha';
    case 'short-deck': return 'Short Deck';
    default: return variant;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardFull: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    flex: 1,
  },
  variantBadge: {
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  variantText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  code: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  fullText: {
    color: Colors.danger,
  },
  playerBar: {
    height: 3,
    backgroundColor: Colors.bgLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  playerBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  fullOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  fullLabel: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
