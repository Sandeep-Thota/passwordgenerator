// ==========================================
// PokerZone - Welcome / Onboarding Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing, FontSize, Shadows, AVATARS, AVATAR_COLORS } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { setPlayerName, setAvatar, avatar: currentAvatar } = useAuthStore();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'ace');

  const handleStart = () => {
    const finalName = name.trim() || 'Player';
    setPlayerName(finalName);
    setAvatar(selectedAvatar);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.logoSection}>
        <Text style={styles.logoSuit}>♠ ♥ ♦ ♣</Text>
        <Text style={styles.logoText}>PokerZone</Text>
        <Text style={styles.tagline}>Premium Multiplayer Poker</Text>
      </Animated.View>

      {/* Name input */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.nameSection}>
        <Text style={styles.sectionLabel}>WHAT SHOULD WE CALL YOU?</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Enter your poker name"
          placeholderTextColor={Colors.textMuted}
          maxLength={20}
          autoFocus
          selectionColor={Colors.primary}
        />
      </Animated.View>

      {/* Avatar selection */}
      <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.avatarSection}>
        <Text style={styles.sectionLabel}>CHOOSE YOUR AVATAR</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((av, index) => (
            <Animated.View
              key={av}
              entering={ZoomIn.duration(200).delay(650 + index * 30)}
            >
              <TouchableOpacity
                style={[
                  styles.avatarOption,
                  { backgroundColor: AVATAR_COLORS[av] || Colors.bgLight },
                  selectedAvatar === av && styles.avatarSelected,
                ]}
                onPress={() => setSelectedAvatar(av)}
                activeOpacity={0.7}
              >
                <Text style={styles.avatarLetter}>{av[0].toUpperCase()}</Text>
                <Text style={styles.avatarName}>{av}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Start button */}
      <Animated.View entering={FadeInUp.duration(500).delay(900)} style={styles.startSection}>
        <Button
          title="Let's Play"
          onPress={handleStart}
          variant="gold"
          size="lg"
          fullWidth
        />
        <Text style={styles.disclaimer}>No real money. Play for fun with friends.</Text>
      </Animated.View>

      {/* Features preview */}
      <Animated.View entering={FadeInUp.duration(500).delay(1100)} style={styles.features}>
        {[
          { icon: '🃏', title: "Texas Hold'em", desc: 'Plus Omaha & Short Deck' },
          { icon: '👥', title: 'Multiplayer', desc: 'Play with up to 9 friends' },
          { icon: '🤖', title: 'Solo Practice', desc: 'Play against AI bots' },
          { icon: '🏆', title: 'Tournaments', desc: 'Sit & Go competitions' },
        ].map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
            <View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  content: {
    padding: Spacing.xxl,
    paddingTop: 80,
    paddingBottom: 60,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.huge,
  },
  logoSuit: {
    fontSize: 32,
    letterSpacing: 12,
    marginBottom: Spacing.md,
    opacity: 0.7,
  },
  logoText: {
    color: Colors.primary,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '500',
    marginTop: Spacing.xs,
    letterSpacing: 2,
  },
  nameSection: {
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: Colors.bgLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarSection: {
    width: '100%',
    marginBottom: Spacing.xxl,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  avatarOption: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: Colors.primary,
    ...Shadows.gold,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  avatarName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 7,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'capitalize',
  },
  startSection: {
    width: '100%',
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
    opacity: 0.6,
  },
  features: {
    width: '100%',
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  featureDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
});
