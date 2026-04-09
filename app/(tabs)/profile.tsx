// ==========================================
// PokerZone - Profile Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize, Shadows, AVATARS, AVATAR_COLORS } from '../../src/constants/theme';
import { Avatar } from '../../src/components/ui/Avatar';
import { useAuthStore } from '../../src/store/authStore';
import { formatChips } from '../../src/utils/formatters';

export default function ProfileScreen() {
  const {
    playerName, setPlayerName, avatar, setAvatar, stats,
  } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playerName);

  const winRate = stats.handsPlayed > 0
    ? ((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)
    : '0.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <Avatar name={playerName} avatar={avatar} size={80} />
        {isEditing ? (
          <View style={styles.editNameRow}>
            <TextInput
              style={styles.editNameInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              maxLength={20}
            />
            <TouchableOpacity
              style={styles.saveName}
              onPress={() => {
                if (editName.trim()) {
                  setPlayerName(editName.trim());
                }
                setIsEditing(false);
              }}
            >
              <Text style={styles.saveNameText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => {
            setEditName(playerName);
            setIsEditing(true);
          }}>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.editHint}>Tap to edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar selection */}
      <Text style={styles.sectionTitle}>Choose Avatar</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map(av => (
          <TouchableOpacity
            key={av}
            style={[
              styles.avatarOption,
              { backgroundColor: AVATAR_COLORS[av] || Colors.bgLight },
              avatar === av && styles.avatarOptionActive,
            ]}
            onPress={() => setAvatar(av)}
          >
            <Text style={styles.avatarInitial}>{av[0].toUpperCase()}</Text>
            {avatar === av && <View style={styles.avatarCheck}><Text style={styles.checkMark}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.handsPlayed}</Text>
          <Text style={styles.statLabel}>Hands Played</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.handsWon}</Text>
          <Text style={styles.statLabel}>Hands Won</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{winRate}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {formatChips(stats.biggestPot)}
          </Text>
          <Text style={styles.statLabel}>Biggest Pot</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, stats.totalWinnings >= 0 ? { color: Colors.success } : { color: Colors.danger }]}>
            {stats.totalWinnings >= 0 ? '+' : ''}{formatChips(stats.totalWinnings)}
          </Text>
          <Text style={styles.statLabel}>Total Profit</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.gamesJoined}</Text>
          <Text style={styles.statLabel}>Games Joined</Text>
        </View>
      </View>

      {/* Best hand */}
      <View style={styles.bestHand}>
        <Text style={styles.bestHandLabel}>Best Hand</Text>
        <Text style={styles.bestHandValue}>{stats.bestHand}</Text>
      </View>

      {/* Achievements teaser */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsGrid}>
        {[
          { icon: '🏆', label: 'First Win', desc: 'Win your first hand', unlocked: stats.handsWon > 0 },
          { icon: '🔥', label: 'Hot Streak', desc: 'Win 5 hands in a row', unlocked: false },
          { icon: '💰', label: 'High Roller', desc: 'Win a pot over 10K', unlocked: stats.biggestPot >= 10000 },
          { icon: '🃏', label: 'Royal Flush', desc: 'Hit a Royal Flush', unlocked: stats.bestHand === 'Royal Flush' },
          { icon: '🎯', label: 'Bluff Master', desc: 'Win 3 hands without showdown', unlocked: false },
          { icon: '⚡', label: 'Quick Draw', desc: 'Play 100 hands', unlocked: stats.handsPlayed >= 100 },
        ].map((achievement, idx) => (
          <View
            key={idx}
            style={[styles.achievement, !achievement.unlocked && styles.achievementLocked]}
          >
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={styles.achievementLabel}>{achievement.label}</Text>
            <Text style={styles.achievementDesc}>{achievement.desc}</Text>
          </View>
        ))}
      </View>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  playerName: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    textAlign: 'center',
  },
  editHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 2,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editNameInput: {
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.primary,
    minWidth: 200,
    textAlign: 'center',
  },
  saveName: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  saveNameText: {
    color: Colors.bgDarkest,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionActive: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  avatarCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.bgDarkest,
    fontSize: 10,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '30%',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  bestHand: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    marginBottom: Spacing.lg,
  },
  bestHandLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bestHandValue: {
    color: Colors.textGold,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    marginTop: Spacing.xs,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  achievement: {
    width: '30%',
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  achievementLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  achievementDesc: {
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
});
