// ==========================================
// PokerZone - Community Cards Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../../engine/types';
import { PlayingCard } from './Card';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../constants/theme';

interface CommunityCardsProps {
  cards: Card[];
  phase: string;
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  if (phase === 'waiting' || phase === 'pre-flop') {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {phase === 'waiting' ? 'Waiting for players...' : 'Pre-flop'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        {/* Render existing cards */}
        {cards.map((card, index) => (
          <PlayingCard
            key={`${card.code}-${index}`}
            card={card}
            size="lg"
            style={styles.card}
          />
        ))}
        {/* Render placeholder slots for remaining cards */}
        {Array.from({ length: 5 - cards.length }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.emptySlot} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    ...Shadows.lg,
  },
  emptySlot: {
    width: 68,
    height: 96,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  placeholder: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
