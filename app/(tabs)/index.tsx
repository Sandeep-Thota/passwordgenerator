// ==========================================
// PokerZone - Lobby Screen (Home)
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { RoomCard } from '../../src/components/lobby/RoomCard';
import { useSocket } from '../../src/hooks/useSocket';
import { useGameStore } from '../../src/store/gameStore';
import { useAuthStore } from '../../src/store/authStore';
import { Room } from '../../src/engine/types';

export default function LobbyScreen() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const { isConnected } = useGameStore();
  const { playerName, avatar } = useAuthStore();
  const { joinRoom } = useSocket();

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/rooms');
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      // Server not running, show demo rooms
      setRooms([]);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    try {
      const room = await joinRoom(joinCode.trim(), playerName, avatar, 1000);
      router.push(`/game/${room.code}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not join room');
    }
  };

  const handleJoinRoom = async (room: any) => {
    try {
      const joined = await joinRoom(room.code, playerName, avatar, room.config?.minBuyIn || 1000);
      router.push(`/game/${joined.code}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not join room');
    }
  };

  return (
    <View style={styles.container}>
      {/* Connection status */}
      <View style={[styles.statusBar, isConnected ? styles.statusOnline : styles.statusOffline]}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.online : Colors.danger }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Connecting...'}
        </Text>
        <Text style={styles.welcomeText}>Welcome, {playerName}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-room')}
            activeOpacity={0.8}
          >
            <Text style={styles.createIcon}>+</Text>
            <Text style={styles.createTitle}>Create Table</Text>
            <Text style={styles.createSubtitle}>Host a private or public game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => setShowJoinInput(!showJoinInput)}
            activeOpacity={0.8}
          >
            <Text style={styles.joinIcon}>🔗</Text>
            <Text style={styles.joinTitle}>Join by Code</Text>
            <Text style={styles.joinSubtitle}>Enter a room code to join</Text>
          </TouchableOpacity>
        </View>

        {/* Join by code input */}
        {showJoinInput && (
          <View style={styles.joinCodeSection}>
            <TextInput
              style={styles.joinCodeInput}
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Enter room code (e.g., ABC123)"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoFocus
              maxLength={6}
            />
            <Button
              title="Join"
              onPress={handleJoinByCode}
              variant="gold"
              disabled={joinCode.length < 4}
            />
          </View>
        )}

        {/* Quick Play Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Play</Text>
          <View style={styles.quickPlayGrid}>
            {[
              { label: "No Limit Hold'em", blinds: '1/2', buyIn: 200, variant: 'texas-holdem' },
              { label: "No Limit Hold'em", blinds: '5/10', buyIn: 1000, variant: 'texas-holdem' },
              { label: 'Pot Limit Omaha', blinds: '1/2', buyIn: 200, variant: 'omaha' },
              { label: 'Short Deck', blinds: '5/10', buyIn: 1000, variant: 'short-deck' },
            ].map((game, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickPlayCard}
                onPress={() => router.push('/create-room')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickPlayLabel}>{game.label}</Text>
                <Text style={styles.quickPlayBlinds}>{game.blinds}</Text>
                <Text style={styles.quickPlayBuyIn}>Buy-in: {game.buyIn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available rooms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Open Tables</Text>
            <Text style={styles.roomCount}>{rooms.length} tables</Text>
          </View>

          {rooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🃏</Text>
              <Text style={styles.emptyTitle}>No open tables</Text>
              <Text style={styles.emptySubtitle}>
                Create a new table or join with a code
              </Text>
            </View>
          ) : (
            rooms.map((room: any) => (
              <RoomCard
                key={room.id}
                name={room.config.name}
                variant={room.config.variant}
                playerCount={room.gameState?.players?.length || 0}
                maxPlayers={room.config.maxPlayers}
                smallBlind={room.config.smallBlind}
                bigBlind={room.config.bigBlind}
                code={room.code}
                createdAt={room.createdAt}
                onJoin={() => handleJoinRoom(room)}
              />
            ))
          )}
        </View>

        {/* Tournament section teaser */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tournaments</Text>
          <TouchableOpacity style={styles.tournamentCard} activeOpacity={0.7}>
            <View style={styles.tournamentBadge}>
              <Text style={styles.tournamentBadgeText}>COMING SOON</Text>
            </View>
            <Text style={styles.tournamentTitle}>Daily Freeroll</Text>
            <Text style={styles.tournamentDetails}>
              Multi-table tournaments with increasing blinds
            </Text>
            <View style={styles.tournamentInfo}>
              <Text style={styles.tournamentInfoText}>Buy-in: Free</Text>
              <Text style={styles.tournamentInfoText}>Prize: 10,000 chips</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tournamentCard} activeOpacity={0.7}>
            <View style={styles.tournamentBadge}>
              <Text style={styles.tournamentBadgeText}>COMING SOON</Text>
            </View>
            <Text style={styles.tournamentTitle}>Sit & Go</Text>
            <Text style={styles.tournamentDetails}>
              Fast-paced single table tournaments
            </Text>
            <View style={styles.tournamentInfo}>
              <Text style={styles.tournamentInfoText}>6 or 9 players</Text>
              <Text style={styles.tournamentInfoText}>Winner takes all</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  welcomeText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginLeft: 'auto',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  createButton: {
    flex: 1,
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...Shadows.gold,
  },
  createIcon: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '300',
    marginBottom: Spacing.xs,
  },
  createTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  createSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  joinButton: {
    flex: 1,
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  joinIcon: {
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  joinTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  joinSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  joinCodeSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  joinCodeInput: {
    flex: 1,
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  roomCount: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  quickPlayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickPlayCard: {
    width: '47%',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickPlayLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  quickPlayBlinds: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    marginVertical: Spacing.xs,
  },
  quickPlayBuyIn: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  tournamentCard: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  tournamentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  tournamentBadgeText: {
    color: Colors.bgDarkest,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tournamentTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  tournamentDetails: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  tournamentInfo: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  tournamentInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
