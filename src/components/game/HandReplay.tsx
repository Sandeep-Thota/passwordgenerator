// ==========================================
// PokerZone - Hand Replay Viewer
// ==========================================
// Step through a completed hand action-by-action

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { HandRecord, Card, GamePhase, PlayerAction } from '../../engine/types';
import { PlayingCard } from './Card';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { SUIT_SYMBOLS } from '../../constants/cards';
import { formatChips } from '../../utils/formatters';

interface HandReplayProps {
  hand: HandRecord;
  onClose: () => void;
}

interface ReplayStep {
  index: number;
  phase: GamePhase;
  playerName: string;
  action: PlayerAction;
  amount?: number;
  communityCards: Card[];
  description: string;
}

export function HandReplay({ hand, onClose }: HandReplayProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = overview

  // Build replay steps from actions
  const steps = useMemo(() => {
    const result: ReplayStep[] = [];
    let currentPhase: GamePhase = 'pre-flop';

    for (let i = 0; i < hand.actions.length; i++) {
      const action = hand.actions[i];

      if (action.phase !== currentPhase) {
        currentPhase = action.phase;
      }

      const cardsForPhase = getCardsForPhase(currentPhase, hand.communityCards);
      const amountStr = action.amount ? ` ${formatChips(action.amount)}` : '';

      result.push({
        index: i,
        phase: currentPhase,
        playerName: action.playerName,
        action: action.action,
        amount: action.amount,
        communityCards: cardsForPhase,
        description: `${action.playerName} ${action.action}s${amountStr}`,
      });
    }

    return result;
  }, [hand]);

  const currentReplayStep = currentStep >= 0 && currentStep < steps.length
    ? steps[currentStep]
    : null;

  const visibleCards = currentReplayStep
    ? currentReplayStep.communityCards
    : hand.communityCards;

  const canGoBack = currentStep > -1;
  const canGoForward = currentStep < steps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hand #{hand.handNumber}</Text>
        <Text style={styles.stepCount}>
          {currentStep + 2}/{steps.length + 1}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Community cards */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.boardSection}>
          <Text style={styles.sectionLabel}>BOARD</Text>
          <View style={styles.cardsRow}>
            {visibleCards.length > 0 ? (
              visibleCards.map((card, idx) => (
                <PlayingCard key={`${card.code}-${idx}`} card={card} size="lg" delay={idx * 80} />
              ))
            ) : (
              <Text style={styles.noBoardText}>No cards dealt yet</Text>
            )}
          </View>
        </Animated.View>

        {/* Current step highlight */}
        {currentReplayStep && (
          <Animated.View entering={FadeInUp.duration(250)} style={styles.currentAction}>
            <View style={[styles.actionDot, { backgroundColor: getActionColor(currentReplayStep.action) }]} />
            <View style={styles.currentActionInfo}>
              <Text style={styles.currentActionPlayer}>{currentReplayStep.playerName}</Text>
              <Text style={[styles.currentActionType, { color: getActionColor(currentReplayStep.action) }]}>
                {currentReplayStep.action.toUpperCase()}
                {currentReplayStep.amount ? ` ${formatChips(currentReplayStep.amount)}` : ''}
              </Text>
            </View>
            <Text style={styles.phaseLabel}>{formatPhase(currentReplayStep.phase)}</Text>
          </Animated.View>
        )}

        {currentStep === -1 && (
          <View style={styles.currentAction}>
            <Text style={styles.overviewText}>Tap ▶ to step through the hand</Text>
          </View>
        )}

        {/* Full action log */}
        <View style={styles.actionLog}>
          <Text style={styles.sectionLabel}>ACTION LOG</Text>
          {hand.actions.map((action, idx) => {
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            const amountStr = action.amount ? ` ${formatChips(action.amount)}` : '';

            // Show phase header when phase changes
            const showPhaseHeader = idx === 0 || hand.actions[idx - 1].phase !== action.phase;

            return (
              <View key={idx}>
                {showPhaseHeader && (
                  <View style={styles.phaseHeader}>
                    <View style={styles.phaseLine} />
                    <Text style={styles.phaseHeaderText}>{formatPhase(action.phase)}</Text>
                    <View style={styles.phaseLine} />
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionRow,
                    isActive && styles.actionRowActive,
                    isPast && styles.actionRowPast,
                  ]}
                  onPress={() => setCurrentStep(idx)}
                >
                  <View style={[styles.actionRowDot, { backgroundColor: getActionColor(action.action) }]} />
                  <Text style={[styles.actionRowName, isActive && styles.actionRowNameActive]}>
                    {action.playerName}
                  </Text>
                  <Text style={[styles.actionRowType, { color: getActionColor(action.action) }]}>
                    {action.action}{amountStr}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Result */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionLabel}>RESULT</Text>
          {hand.winners.map((winner, idx) => (
            <View key={idx} style={styles.winnerRow}>
              <Text style={styles.winnerName}>🏆 {winner.playerName}</Text>
              <Text style={styles.winnerAmount}>+{formatChips(winner.amount)}</Text>
              {winner.hand && (
                <Text style={styles.winnerHand}>{winner.hand.description}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Player cards (if shown) */}
        {hand.players.some(p => p.cards && p.cards.length > 0) && (
          <View style={styles.playerCardsSection}>
            <Text style={styles.sectionLabel}>PLAYER CARDS</Text>
            {hand.players.filter(p => p.cards && p.cards.length > 0).map((p, idx) => (
              <View key={idx} style={styles.playerCardRow}>
                <Text style={styles.playerCardName}>{p.name}</Text>
                <View style={styles.playerCards}>
                  {p.cards!.map((card, cIdx) => (
                    <PlayingCard key={cIdx} card={card} size="sm" />
                  ))}
                </View>
                <Text style={styles.playerCardProfit}>
                  {p.endChips - p.startChips >= 0 ? '+' : ''}
                  {formatChips(p.endChips - p.startChips)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Navigation controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, !canGoBack && styles.controlDisabled]}
          onPress={() => setCurrentStep(prev => Math.max(-1, prev - 1))}
          disabled={!canGoBack}
        >
          <Text style={[styles.controlText, !canGoBack && styles.controlTextDisabled]}>◀ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCurrentStep(-1)}
        >
          <Text style={styles.controlText}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.controlPrimary, !canGoForward && styles.controlDisabled]}
          onPress={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
          disabled={!canGoForward}
        >
          <Text style={[styles.controlTextPrimary, !canGoForward && styles.controlTextDisabled]}>Next ▶</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function getCardsForPhase(phase: GamePhase, allCards: Card[]): Card[] {
  switch (phase) {
    case 'pre-flop': return [];
    case 'flop': return allCards.slice(0, 3);
    case 'turn': return allCards.slice(0, 4);
    case 'river':
    case 'showdown':
    case 'finished': return allCards.slice(0, 5);
    default: return [];
  }
}

function formatPhase(phase: GamePhase): string {
  switch (phase) {
    case 'pre-flop': return 'PRE-FLOP';
    case 'flop': return 'FLOP';
    case 'turn': return 'TURN';
    case 'river': return 'RIVER';
    case 'showdown': return 'SHOWDOWN';
    default: return phase.toUpperCase();
  }
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
  stepCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  boardSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  noBoardText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontStyle: 'italic',
    paddingVertical: Spacing.xl,
  },
  currentAction: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  actionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  currentActionInfo: {
    flex: 1,
  },
  currentActionPlayer: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  currentActionType: {
    fontSize: FontSize.md,
    fontWeight: '800',
    marginTop: 2,
  },
  phaseLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  overviewText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    flex: 1,
  },
  actionLog: {
    marginBottom: Spacing.xxl,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  phaseLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  phaseHeaderText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  actionRowActive: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionRowPast: {
    opacity: 0.5,
  },
  actionRowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionRowName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  actionRowNameActive: {
    color: Colors.textPrimary,
  },
  actionRowType: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  resultSection: {
    marginBottom: Spacing.xxl,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    flexWrap: 'wrap',
  },
  winnerName: {
    color: Colors.textGold,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  winnerAmount: {
    color: Colors.success,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  winnerHand: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  playerCardsSection: {
    marginBottom: Spacing.xxl,
  },
  playerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playerCardName: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    width: 80,
  },
  playerCards: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  playerCardProfit: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    width: 60,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgDark,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  controlButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  controlText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  controlTextPrimary: {
    color: Colors.bgDarkest,
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  controlTextDisabled: {
    opacity: 0.5,
  },
});
