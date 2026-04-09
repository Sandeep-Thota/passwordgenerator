// ==========================================
// PokerZone - Poker Table Component
// ==========================================
// The main game table with felt, seats, cards, pot

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GameState } from '../../engine/types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../constants/theme';
import { SEAT_POSITIONS } from '../../constants/cards';
import { PlayerSeat } from './PlayerSeat';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';
import { formatBlinds } from '../../utils/formatters';

interface PokerTableProps {
  gameState: GameState;
  heroPlayerId: string;
  onSitDown: (seatIndex: number) => void;
}

export function PokerTable({ gameState, heroPlayerId, onSitDown }: PokerTableProps) {
  const screenWidth = Dimensions.get('window').width;
  const tableWidth = Math.min(screenWidth - 24, 500);
  const tableHeight = tableWidth * 0.7;

  // Rotate seats so hero is always at bottom
  const heroPlayer = gameState.players.find(p => p.id === heroPlayerId);
  const heroSeatIndex = heroPlayer?.seatIndex ?? 0;

  // Get all seat positions, including empty ones
  const maxSeats = 9;
  const occupiedSeats = new Map(gameState.players.map(p => [p.seatIndex, p]));

  return (
    <View style={styles.container}>
      {/* Table surface */}
      <View style={[styles.table, { width: tableWidth, height: tableHeight }]}>
        {/* Outer border - wood trim */}
        <View style={[styles.tableOuter, { width: tableWidth, height: tableHeight }]}>
          {/* Felt surface */}
          <View style={styles.felt}>
            {/* Table logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>POKERZONE</Text>
            </View>

            {/* Blinds info */}
            <View style={styles.blindsInfo}>
              <Text style={styles.blindsText}>
                Blinds: {formatBlinds(gameState.smallBlindAmount, gameState.bigBlindAmount)}
              </Text>
              {gameState.handNumber > 0 && (
                <Text style={styles.handNumber}>Hand #{gameState.handNumber}</Text>
              )}
            </View>

            {/* Community cards */}
            <View style={styles.communityArea}>
              <CommunityCards
                cards={gameState.communityCards}
                phase={gameState.phase}
              />
            </View>

            {/* Pot display */}
            <View style={styles.potArea}>
              <PotDisplay
                pots={gameState.pots}
                phase={gameState.phase}
              />
            </View>
          </View>
        </View>

        {/* Player seats */}
        {Array.from({ length: maxSeats }).map((_, seatIdx) => {
          const player = occupiedSeats.get(seatIdx);
          const position = SEAT_POSITIONS[seatIdx];
          if (!position) return null;

          const isCurrentPlayer = gameState.currentPlayerIndex >= 0 &&
            gameState.players[gameState.currentPlayerIndex]?.id === player?.id;

          return (
            <PlayerSeat
              key={seatIdx}
              player={player}
              seatIndex={seatIdx}
              isCurrentPlayer={isCurrentPlayer}
              isHero={player?.id === heroPlayerId}
              onSit={() => onSitDown(seatIdx)}
              position={position}
              tableWidth={tableWidth}
              tableHeight={tableHeight}
            />
          );
        })}
      </View>

      {/* Game phase indicator */}
      {gameState.phase !== 'waiting' && (
        <View style={styles.phaseIndicator}>
          <Text style={styles.phaseText}>{getPhaseLabel(gameState.phase)}</Text>
        </View>
      )}
    </View>
  );
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'pre-flop': return 'PRE-FLOP';
    case 'flop': return 'FLOP';
    case 'turn': return 'TURN';
    case 'river': return 'RIVER';
    case 'showdown': return 'SHOWDOWN';
    case 'finished': return 'HAND COMPLETE';
    default: return '';
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  table: {
    position: 'relative',
  },
  tableOuter: {
    borderRadius: 150,
    backgroundColor: '#3D2B1F', // Wood trim color
    padding: 6,
    ...Shadows.lg,
  },
  felt: {
    flex: 1,
    backgroundColor: Colors.feltGreen,
    borderRadius: 144,
    borderWidth: 3,
    borderColor: Colors.feltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Subtle gradient effect via shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    opacity: 0.12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 8,
  },
  blindsInfo: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    alignItems: 'center',
  },
  blindsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  handNumber: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  communityArea: {
    marginTop: -10,
  },
  potArea: {
    marginTop: Spacing.sm,
  },
  phaseIndicator: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  phaseText: {
    color: Colors.textGold,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
