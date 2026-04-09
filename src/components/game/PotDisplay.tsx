// ==========================================
// PokerZone - Pot Display Component
// ==========================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withSequence, FadeIn,
} from 'react-native-reanimated';
import { Pot } from '../../engine/types';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../constants/theme';
import { formatChips } from '../../utils/formatters';

interface PotDisplayProps {
  pots: Pot[];
  phase: string;
}

export function PotDisplay({ pots, phase }: PotDisplayProps) {
  const totalPot = pots.reduce((sum, pot) => sum + pot.amount, 0);
  const scale = useSharedValue(1);

  // Bounce when pot changes
  useEffect(() => {
    if (totalPot > 0) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [totalPot]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (totalPot === 0 && phase === 'waiting') return null;

  return (
    <View style={styles.container}>
      {/* Main pot */}
      <Animated.View entering={FadeIn.duration(300)} style={[styles.mainPot, animatedStyle]}>
        <View style={styles.chipIcon}>
          <View style={styles.chipInner} />
        </View>
        <Text style={styles.potLabel}>POT</Text>
        <Text style={styles.potAmount}>{formatChips(totalPot)}</Text>
      </Animated.View>

      {/* Side pots */}
      {pots.length > 1 && (
        <Animated.View entering={FadeIn.duration(200).delay(100)} style={styles.sidePots}>
          {pots.map((pot, index) => (
            <View key={index} style={styles.sidePot}>
              <Text style={styles.sidePotLabel}>
                {index === 0 ? 'Main' : `Side ${index}`}
              </Text>
              <Text style={styles.sidePotAmount}>{formatChips(pot.amount)}</Text>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  mainPot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    ...Shadows.sm,
  },
  chipIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryDark,
  },
  potLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  potAmount: {
    color: Colors.textGold,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  sidePots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sidePot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    gap: Spacing.xs,
  },
  sidePotLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  sidePotAmount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
