// ==========================================
// PokerZone - Solo Play Setup Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../src/constants/theme';
import { Button } from '../src/components/ui/Button';
import { GameVariant } from '../src/engine/types';

type Difficulty = 'easy' | 'medium' | 'hard';

export default function SoloPlayScreen() {
  const [variant, setVariant] = useState<GameVariant>('texas-holdem');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [numBots, setNumBots] = useState(5);
  const [blinds, setBlinds] = useState<[number, number]>([1, 2]);

  const handleStart = () => {
    // Navigate to offline game with params
    router.replace({
      pathname: '/game/[id]',
      params: {
        id: 'solo',
        mode: 'offline',
        variant,
        difficulty,
        numBots: numBots.toString(),
        smallBlind: blinds[0].toString(),
        bigBlind: blinds[1].toString(),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <Text style={styles.headerTitle}>Practice Mode</Text>
        <Text style={styles.headerSubtitle}>
          Sharpen your skills against AI opponents
        </Text>
      </View>

      {/* Game variant */}
      <Text style={styles.label}>Game Type</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'texas-holdem' as GameVariant, label: "Hold'em", icon: '♠' },
          { value: 'omaha' as GameVariant, label: 'Omaha', icon: '♦' },
          { value: 'short-deck' as GameVariant, label: 'Short Deck', icon: '♥' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionCard, variant === opt.value && styles.optionCardActive]}
            onPress={() => setVariant(opt.value)}
          >
            <Text style={styles.optionIcon}>{opt.icon}</Text>
            <Text style={[styles.optionLabel, variant === opt.value && styles.optionLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Difficulty */}
      <Text style={styles.label}>Bot Difficulty</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'easy' as Difficulty, label: 'Easy', desc: 'Loose & passive', icon: '😊' },
          { value: 'medium' as Difficulty, label: 'Medium', desc: 'Balanced play', icon: '🧐' },
          { value: 'hard' as Difficulty, label: 'Hard', desc: 'Tight & aggressive', icon: '😈' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.difficultyCard, difficulty === opt.value && styles.optionCardActive]}
            onPress={() => setDifficulty(opt.value)}
          >
            <Text style={styles.difficultyIcon}>{opt.icon}</Text>
            <Text style={[styles.optionLabel, difficulty === opt.value && styles.optionLabelActive]}>
              {opt.label}
            </Text>
            <Text style={styles.difficultyDesc}>{opt.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Number of bots */}
      <Text style={styles.label}>Number of Opponents</Text>
      <View style={styles.optionRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
          <TouchableOpacity
            key={num}
            style={[styles.numButton, numBots === num && styles.numButtonActive]}
            onPress={() => setNumBots(num)}
          >
            <Text style={[styles.numText, numBots === num && styles.numTextActive]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Blinds */}
      <Text style={styles.label}>Blinds</Text>
      <View style={styles.optionRow}>
        {[
          { value: [1, 2] as [number, number], label: '1/2' },
          { value: [5, 10] as [number, number], label: '5/10' },
          { value: [10, 20] as [number, number], label: '10/20' },
          { value: [25, 50] as [number, number], label: '25/50' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.blindOption, blinds[0] === opt.value[0] && styles.optionCardActive]}
            onPress={() => setBlinds(opt.value)}
          >
            <Text style={[styles.blindText, blinds[0] === opt.value[0] && styles.optionLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {numBots} {difficulty} bot{numBots > 1 ? 's' : ''} | {blinds[0]}/{blinds[1]} blinds | 1,000 starting chips
        </Text>
      </View>

      {/* Start button */}
      <Button
        title="Start Practice Game"
        onPress={handleStart}
        variant="gold"
        size="lg"
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionCard: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgMedium,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  optionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  difficultyCard: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgMedium,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  difficultyIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  difficultyDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  numButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgMedium,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  numText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  numTextActive: {
    color: Colors.bgDarkest,
  },
  blindOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgMedium,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  blindText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  summary: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
