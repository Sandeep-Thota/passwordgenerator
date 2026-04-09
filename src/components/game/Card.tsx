// ==========================================
// PokerZone - Playing Card Component
// ==========================================
// Beautiful, animated playing cards with face-up/face-down states

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card as CardType } from '../../engine/types';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { SUIT_SYMBOLS, SUIT_COLORS, RANK_DISPLAY } from '../../constants/cards';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  faceDown?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  style?: any;
}

const CARD_SIZES = {
  sm: { width: 36, height: 52, fontSize: 11, suitSize: 10 },
  md: { width: 52, height: 74, fontSize: 15, suitSize: 14 },
  lg: { width: 68, height: 96, fontSize: 19, suitSize: 18 },
  xl: { width: 88, height: 124, fontSize: 24, suitSize: 22 },
};

export function PlayingCard({
  card,
  size = 'md',
  faceDown = false,
  highlighted = false,
  dimmed = false,
  style,
}: CardProps) {
  const dims = CARD_SIZES[size];
  const isHidden = faceDown || card.code === '??';

  if (isHidden) {
    return (
      <View style={[
        styles.card,
        {
          width: dims.width,
          height: dims.height,
          backgroundColor: Colors.cardBack,
        },
        style,
      ]}>
        <View style={styles.cardBackInner}>
          <View style={styles.cardBackPattern}>
            <Text style={[styles.cardBackLogo, { fontSize: dims.suitSize + 4 }]}>PZ</Text>
          </View>
        </View>
      </View>
    );
  }

  const suitColor = SUIT_COLORS[card.suit] || Colors.suitBlack;
  const suitSymbol = SUIT_SYMBOLS[card.suit] || '?';
  const rankText = RANK_DISPLAY[card.rank] || card.rank;

  return (
    <View style={[
      styles.card,
      {
        width: dims.width,
        height: dims.height,
        backgroundColor: Colors.cardWhite,
      },
      highlighted && styles.highlighted,
      dimmed && styles.dimmed,
      style,
    ]}>
      {/* Top-left rank & suit */}
      <View style={styles.cornerTop}>
        <Text style={[styles.rank, { fontSize: dims.fontSize, color: suitColor }]}>
          {rankText}
        </Text>
        <Text style={[styles.suit, { fontSize: dims.suitSize, color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>

      {/* Center suit */}
      <View style={styles.center}>
        <Text style={[styles.centerSuit, { fontSize: dims.suitSize * 2, color: suitColor }]}>
          {suitSymbol}
        </Text>
      </View>

      {/* Bottom-right rank & suit (rotated) */}
      <View style={styles.cornerBottom}>
        <Text style={[styles.suit, { fontSize: dims.suitSize, color: suitColor }]}>
          {suitSymbol}
        </Text>
        <Text style={[styles.rank, { fontSize: dims.fontSize, color: suitColor }]}>
          {rankText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...Shadows.card,
  },
  highlighted: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  dimmed: {
    opacity: 0.5,
  },
  cornerTop: {
    position: 'absolute',
    top: 3,
    left: 4,
    alignItems: 'center',
  },
  cornerBottom: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    fontWeight: '800',
    lineHeight: undefined,
  },
  suit: {
    marginTop: -2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSuit: {
    fontWeight: '400',
  },
  // Card back styles
  cardBackInner: {
    flex: 1,
    margin: 3,
    borderRadius: BorderRadius.sm - 2,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackPattern: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  cardBackLogo: {
    color: '#60A5FA',
    fontWeight: '900',
    letterSpacing: 1,
    opacity: 0.7,
  },
});
