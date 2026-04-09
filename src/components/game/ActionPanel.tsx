// ==========================================
// PokerZone - Action Panel Component
// ==========================================
// The bottom action bar for fold/check/call/raise

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { PlayerAction, GameState } from '../../engine/types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { formatChips } from '../../utils/formatters';

interface ActionPanelProps {
  gameState: GameState;
  playerId: string;
  validActions: PlayerAction[];
  minBet: number;
  maxBet: number;
  onAction: (action: PlayerAction, amount?: number) => void;
}

export function ActionPanel({
  gameState,
  playerId,
  validActions,
  minBet,
  maxBet,
  onAction,
}: ActionPanelProps) {
  const [raiseAmount, setRaiseAmount] = useState(minBet);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  const highestBet = Math.max(0, ...gameState.players.map(p => p.currentBet));
  const callAmount = highestBet - player.currentBet;

  const canFold = validActions.includes('fold');
  const canCheck = validActions.includes('check');
  const canCall = validActions.includes('call');
  const canRaise = validActions.includes('raise');
  const canAllIn = validActions.includes('all-in');

  const presetAmounts = [
    { label: 'Min', value: minBet },
    { label: '1/2 Pot', value: Math.floor(gameState.pots.reduce((s, p) => s + p.amount, 0) / 2) },
    { label: '3/4 Pot', value: Math.floor(gameState.pots.reduce((s, p) => s + p.amount, 0) * 0.75) },
    { label: 'Pot', value: gameState.pots.reduce((s, p) => s + p.amount, 0) },
  ].filter(p => p.value >= minBet && p.value <= maxBet);

  if (showRaiseSlider) {
    return (
      <View style={styles.container}>
        <View style={styles.raisePanel}>
          <Text style={styles.raiseTitle}>Raise to</Text>

          {/* Amount display */}
          <View style={styles.amountDisplay}>
            <TextInput
              style={styles.amountInput}
              value={raiseAmount.toString()}
              onChangeText={(text) => {
                const num = parseInt(text) || minBet;
                setRaiseAmount(Math.min(Math.max(num, minBet), maxBet));
              }}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          {/* Preset buttons */}
          <View style={styles.presetRow}>
            {presetAmounts.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[styles.presetButton, raiseAmount === preset.value && styles.presetActive]}
                onPress={() => setRaiseAmount(preset.value)}
              >
                <Text style={[styles.presetText, raiseAmount === preset.value && styles.presetTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* +/- buttons */}
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => setRaiseAmount(Math.max(minBet, raiseAmount - gameState.bigBlindAmount))}
            >
              <Text style={styles.adjustText}>-BB</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => setRaiseAmount(Math.min(maxBet, raiseAmount + gameState.bigBlindAmount))}
            >
              <Text style={styles.adjustText}>+BB</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm / Cancel */}
          <View style={styles.raiseActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRaiseSlider(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmRaise}
              onPress={() => {
                onAction('raise', raiseAmount);
                setShowRaiseSlider(false);
              }}
            >
              <Text style={styles.confirmRaiseText}>Raise {formatChips(raiseAmount)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionBar}>
        {/* Fold button */}
        {canFold && (
          <TouchableOpacity
            style={[styles.actionButton, styles.foldButton]}
            onPress={() => onAction('fold')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>FOLD</Text>
          </TouchableOpacity>
        )}

        {/* Check button */}
        {canCheck && (
          <TouchableOpacity
            style={[styles.actionButton, styles.checkButton]}
            onPress={() => onAction('check')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>CHECK</Text>
          </TouchableOpacity>
        )}

        {/* Call button */}
        {canCall && (
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => onAction('call')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>CALL</Text>
            <Text style={styles.actionAmountText}>{formatChips(callAmount)}</Text>
          </TouchableOpacity>
        )}

        {/* Raise button */}
        {canRaise && (
          <TouchableOpacity
            style={[styles.actionButton, styles.raiseButton]}
            onPress={() => {
              setRaiseAmount(minBet);
              setShowRaiseSlider(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>RAISE</Text>
          </TouchableOpacity>
        )}

        {/* All-in button */}
        {canAllIn && (
          <TouchableOpacity
            style={[styles.actionButton, styles.allInButton]}
            onPress={() => onAction('all-in')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>ALL IN</Text>
            <Text style={styles.actionAmountText}>{formatChips(player.chips)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    maxWidth: 120,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  foldButton: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  checkButton: {
    backgroundColor: Colors.info,
  },
  callButton: {
    backgroundColor: Colors.success,
  },
  raiseButton: {
    backgroundColor: Colors.warning,
  },
  allInButton: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionAmountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  // Raise panel styles
  raisePanel: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  raiseTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  amountDisplay: {
    alignItems: 'center',
  },
  amountInput: {
    color: Colors.textGold,
    fontSize: FontSize.xxxl,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    minWidth: 150,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  presetTextActive: {
    color: Colors.bgDarkest,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  adjustButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adjustText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  raiseActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  confirmRaise: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    ...Shadows.sm,
  },
  confirmRaiseText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '900',
  },
});
