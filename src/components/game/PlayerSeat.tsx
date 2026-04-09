// ==========================================
// PokerZone - Player Seat Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Player } from '../../engine/types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { Avatar } from '../ui/Avatar';
import { PlayingCard } from './Card';
import { formatChips } from '../../utils/formatters';

interface PlayerSeatProps {
  player?: Player;
  seatIndex: number;
  isCurrentPlayer: boolean;
  isHero: boolean;
  onSit?: () => void;
  position: { x: number; y: number };
  tableWidth: number;
  tableHeight: number;
}

export function PlayerSeat({
  player,
  seatIndex,
  isCurrentPlayer,
  isHero,
  onSit,
  position,
  tableWidth,
  tableHeight,
}: PlayerSeatProps) {
  const left = position.x * tableWidth - 45;
  const top = position.y * tableHeight - 35;

  // Empty seat
  if (!player) {
    return (
      <TouchableOpacity
        style={[styles.emptySeat, { left, top }]}
        onPress={onSit}
        activeOpacity={0.7}
      >
        <View style={styles.emptySeatInner}>
          <Text style={styles.emptySeatText}>+</Text>
          <Text style={styles.emptySeatLabel}>Sit</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const isFolded = player.isFolded;
  const isAllIn = player.isAllIn;
  const isWinner = player.winAmount > 0;

  return (
    <View style={[
      styles.seat,
      { left, top },
      isCurrentPlayer && styles.activeSeat,
      isFolded && styles.foldedSeat,
      isWinner && styles.winnerSeat,
    ]}>
      {/* Player cards (visible for hero or showdown) */}
      {player.cards.length > 0 && (
        <View style={[
          styles.cards,
          isHero ? styles.heroCards : styles.opponentCards,
        ]}>
          {player.cards.map((card, idx) => (
            <PlayingCard
              key={idx}
              card={card}
              size={isHero ? 'md' : 'sm'}
              faceDown={card.code === '??'}
              dimmed={isFolded}
              style={idx > 0 ? { marginLeft: isHero ? -16 : -12 } : undefined}
            />
          ))}
        </View>
      )}

      {/* Avatar & Info */}
      <View style={[styles.playerInfo, isCurrentPlayer && styles.playerInfoActive]}>
        <Avatar
          name={player.name}
          avatar={player.avatar}
          size={isHero ? 42 : 36}
          isDealer={player.isDealer}
          isTurn={isCurrentPlayer}
        />
        <View style={styles.nameChips}>
          <Text
            style={[styles.playerName, isFolded && styles.foldedText]}
            numberOfLines={1}
          >
            {player.name}
          </Text>
          <Text style={[
            styles.chipCount,
            isAllIn && styles.allInChips,
            isFolded && styles.foldedText,
          ]}>
            {isAllIn ? 'ALL IN' : formatChips(player.chips)}
          </Text>
        </View>
      </View>

      {/* Current bet */}
      {player.currentBet > 0 && (
        <View style={styles.betBubble}>
          <Text style={styles.betAmount}>{formatChips(player.currentBet)}</Text>
        </View>
      )}

      {/* Last action badge */}
      {player.lastAction && !isFolded && (
        <View style={[styles.actionBadge, getActionStyle(player.lastAction)]}>
          <Text style={styles.actionText}>
            {player.lastAction.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Win amount */}
      {isWinner && (
        <View style={styles.winBadge}>
          <Text style={styles.winText}>+{formatChips(player.winAmount)}</Text>
        </View>
      )}

      {/* Timer bar */}
      {isCurrentPlayer && (
        <View style={styles.timerBar}>
          <View style={styles.timerProgress} />
        </View>
      )}

      {/* Blind indicator */}
      {(player.isSmallBlind || player.isBigBlind) && (
        <View style={[styles.blindBadge, player.isBigBlind ? styles.bbBadge : styles.sbBadge]}>
          <Text style={styles.blindText}>{player.isBigBlind ? 'BB' : 'SB'}</Text>
        </View>
      )}
    </View>
  );
}

function getActionStyle(action: string) {
  switch (action) {
    case 'fold': return { backgroundColor: Colors.textMuted };
    case 'check': return { backgroundColor: Colors.info };
    case 'call': return { backgroundColor: Colors.success };
    case 'bet':
    case 'raise': return { backgroundColor: Colors.warning };
    case 'all-in': return { backgroundColor: Colors.danger };
    default: return {};
  }
}

const styles = StyleSheet.create({
  emptySeat: {
    position: 'absolute',
    width: 90,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySeatInner: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.round,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  emptySeatText: {
    color: Colors.textMuted,
    fontSize: FontSize.xxl,
    fontWeight: '300',
  },
  emptySeatLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: -2,
  },
  seat: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
    zIndex: 10,
  },
  activeSeat: {
    zIndex: 20,
  },
  foldedSeat: {
    opacity: 0.5,
  },
  winnerSeat: {
    opacity: 1,
  },
  cards: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  heroCards: {
    transform: [{ scale: 1 }],
  },
  opponentCards: {
    transform: [{ scale: 0.9 }],
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 90,
    ...Shadows.md,
  },
  playerInfoActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.bgLight,
  },
  nameChips: {
    flexShrink: 1,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    maxWidth: 60,
  },
  chipCount: {
    color: Colors.textGold,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  allInChips: {
    color: Colors.danger,
  },
  foldedText: {
    color: Colors.textMuted,
  },
  betBubble: {
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  betAmount: {
    color: Colors.textGold,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  actionBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  winBadge: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadows.gold,
  },
  winText: {
    color: Colors.bgDarkest,
    fontSize: FontSize.sm,
    fontWeight: '900',
  },
  timerBar: {
    width: '80%',
    height: 3,
    backgroundColor: Colors.bgLight,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  timerProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  blindBadge: {
    position: 'absolute',
    top: -6,
    left: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgDark,
  },
  sbBadge: {
    backgroundColor: Colors.info,
  },
  bbBadge: {
    backgroundColor: Colors.warning,
  },
  blindText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },
});
