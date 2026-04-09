// ==========================================
// PokerZone - Create Room Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../src/constants/theme';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { useSocket } from '../src/hooks/useSocket';
import { useAuthStore } from '../src/store/authStore';
import { useGameStore } from '../src/store/gameStore';
import { GameVariant, BettingStructure, RoomConfig } from '../src/engine/types';
import { generateRoomName } from '../src/utils/formatters';

export default function CreateRoomScreen() {
  const [name, setName] = useState(generateRoomName());
  const [variant, setVariant] = useState<GameVariant>('texas-holdem');
  const [bettingStructure, setBettingStructure] = useState<BettingStructure>('no-limit');
  const [smallBlind, setSmallBlind] = useState('1');
  const [bigBlind, setBigBlind] = useState('2');
  const [ante, setAnte] = useState('0');
  const [maxPlayers, setMaxPlayers] = useState(9);
  const [minBuyIn, setMinBuyIn] = useState('100');
  const [maxBuyIn, setMaxBuyIn] = useState('1000');
  const [turnTimeLimit, setTurnTimeLimit] = useState(30);
  const [isPrivate, setIsPrivate] = useState(true);
  const [autoStart, setAutoStart] = useState(true);
  const [allowStraddle, setAllowStraddle] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { createRoom, joinRoom } = useSocket();
  const { playerName, avatar } = useAuthStore();
  const { isConnected } = useGameStore();

  const handleCreate = async () => {
    if (!isConnected) {
      Alert.alert(
        'Server Not Available',
        'The multiplayer server is not running. Would you like to play Solo Practice against AI bots instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Solo Practice', onPress: () => router.replace('/solo-play') },
        ]
      );
      return;
    }

    setIsCreating(true);
    try {
      const config: RoomConfig = {
        name,
        variant,
        bettingStructure,
        smallBlind: parseInt(smallBlind) || 1,
        bigBlind: parseInt(bigBlind) || 2,
        ante: parseInt(ante) || 0,
        minBuyIn: parseInt(minBuyIn) || 100,
        maxBuyIn: parseInt(maxBuyIn) || 1000,
        maxPlayers,
        turnTimeLimit,
        autoStart,
        isPrivate,
        allowStraddle,
        runItTwice: false,
      };

      const room = await createRoom(config);
      // Auto-join the room
      await joinRoom(room.code, playerName, avatar, config.minBuyIn);
      router.replace(`/game/${room.code}`);
    } catch (error: any) {
      Alert.alert(
        'Connection Error',
        'Could not connect to the server. Try Solo Practice instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Solo Practice', onPress: () => router.replace('/solo-play') },
        ]
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Room name */}
      <Input
        label="Table Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter table name"
      />

      {/* Game variant */}
      <Text style={styles.label}>Game Type</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'texas-holdem', label: "Texas Hold'em" },
          { value: 'omaha', label: 'Omaha' },
          { value: 'short-deck', label: 'Short Deck' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionButton, variant === opt.value && styles.optionActive]}
            onPress={() => setVariant(opt.value as GameVariant)}
          >
            <Text style={[styles.optionText, variant === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Betting structure */}
      <Text style={styles.label}>Betting Structure</Text>
      <View style={styles.optionRow}>
        {[
          { value: 'no-limit', label: 'No Limit' },
          { value: 'pot-limit', label: 'Pot Limit' },
          { value: 'fixed-limit', label: 'Fixed Limit' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionButton, bettingStructure === opt.value && styles.optionActive]}
            onPress={() => setBettingStructure(opt.value as BettingStructure)}
          >
            <Text style={[styles.optionText, bettingStructure === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Blinds */}
      <View style={styles.blindsRow}>
        <View style={{ flex: 1 }}>
          <Input
            label="Small Blind"
            value={smallBlind}
            onChangeText={setSmallBlind}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Big Blind"
            value={bigBlind}
            onChangeText={setBigBlind}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Ante"
            value={ante}
            onChangeText={setAnte}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Buy-in range */}
      <View style={styles.blindsRow}>
        <View style={{ flex: 1 }}>
          <Input
            label="Min Buy-in"
            value={minBuyIn}
            onChangeText={setMinBuyIn}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input
            label="Max Buy-in"
            value={maxBuyIn}
            onChangeText={setMaxBuyIn}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Max players */}
      <Text style={styles.label}>Max Players</Text>
      <View style={styles.optionRow}>
        {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <TouchableOpacity
            key={num}
            style={[styles.playerButton, maxPlayers === num && styles.optionActive]}
            onPress={() => setMaxPlayers(num)}
          >
            <Text style={[styles.optionText, maxPlayers === num && styles.optionTextActive]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Turn time */}
      <Text style={styles.label}>Turn Time Limit</Text>
      <View style={styles.optionRow}>
        {[15, 20, 30, 45, 60].map(seconds => (
          <TouchableOpacity
            key={seconds}
            style={[styles.optionButton, turnTimeLimit === seconds && styles.optionActive]}
            onPress={() => setTurnTimeLimit(seconds)}
          >
            <Text style={[styles.optionText, turnTimeLimit === seconds && styles.optionTextActive]}>
              {seconds}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Toggle options */}
      <View style={styles.toggleSection}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Private Table</Text>
            <Text style={styles.toggleDescription}>Only accessible via room code</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: Colors.bgLight, true: Colors.primaryDark }}
            thumbColor={isPrivate ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Auto-start</Text>
            <Text style={styles.toggleDescription}>Start game when 2+ players join</Text>
          </View>
          <Switch
            value={autoStart}
            onValueChange={setAutoStart}
            trackColor={{ false: Colors.bgLight, true: Colors.primaryDark }}
            thumbColor={autoStart ? Colors.primary : Colors.textMuted}
          />
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Allow Straddle</Text>
            <Text style={styles.toggleDescription}>Players can straddle pre-flop</Text>
          </View>
          <Switch
            value={allowStraddle}
            onValueChange={setAllowStraddle}
            trackColor={{ false: Colors.bgLight, true: Colors.primaryDark }}
            thumbColor={allowStraddle ? Colors.primary : Colors.textMuted}
          />
        </View>
      </View>

      {/* Create button */}
      <Button
        title="Create Table"
        onPress={handleCreate}
        variant="gold"
        size="lg"
        fullWidth
        loading={isCreating}
      />

      <View style={{ height: 40 }} />
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
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  optionTextActive: {
    color: Colors.bgDarkest,
  },
  playerButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blindsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  toggleSection: {
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  toggleDescription: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});
