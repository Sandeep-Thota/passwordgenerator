// ==========================================
// PokerZone - Settings Screen
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function SettingsScreen() {
  const {
    soundEnabled, setSoundEnabled,
    hapticEnabled, setHapticEnabled,
    showHandStrength, setShowHandStrength,
    autoMuck, setAutoMuck,
    fourColorDeck, setFourColorDeck,
    theme, setTheme,
  } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Gameplay */}
      <Text style={styles.sectionTitle}>Gameplay</Text>
      <View style={styles.section}>
        <SettingToggle
          label="Hand Strength Indicator"
          description="Show hand strength percentage during play"
          value={showHandStrength}
          onToggle={setShowHandStrength}
        />
        <SettingToggle
          label="Auto-muck Losing Hands"
          description="Automatically hide your cards when you lose"
          value={autoMuck}
          onToggle={setAutoMuck}
        />
        <SettingToggle
          label="Four-color Deck"
          description="Use distinct colors for each suit"
          value={fourColorDeck}
          onToggle={setFourColorDeck}
        />
      </View>

      {/* Audio & Feedback */}
      <Text style={styles.sectionTitle}>Audio & Feedback</Text>
      <View style={styles.section}>
        <SettingToggle
          label="Sound Effects"
          description="Card dealing, chip sounds, and notifications"
          value={soundEnabled}
          onToggle={setSoundEnabled}
        />
        <SettingToggle
          label="Haptic Feedback"
          description="Vibration feedback on actions"
          value={hapticEnabled}
          onToggle={setHapticEnabled}
        />
      </View>

      {/* Appearance */}
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.section}>
        <View style={styles.themeRow}>
          <Text style={styles.themeLabel}>Theme</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, theme === 'dark' && styles.themeOptionActive]}
              onPress={() => setTheme('dark')}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text style={[styles.themeText, theme === 'dark' && styles.themeTextActive]}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, theme === 'light' && styles.themeOptionActive]}
              onPress={() => setTheme('light')}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text style={[styles.themeText, theme === 'light' && styles.themeTextActive]}>Light</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* About */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.section}>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Build</Text>
          <Text style={styles.aboutValue}>2024.04.1</Text>
        </View>
      </View>

      {/* Legal */}
      <View style={styles.legalSection}>
        <TouchableOpacity style={styles.legalLink}>
          <Text style={styles.legalText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legalLink}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.legalLink}>
          <Text style={styles.legalText}>Responsible Gaming</Text>
        </TouchableOpacity>
      </View>

      {/* Branding */}
      <View style={styles.branding}>
        <Text style={styles.brandText}>PokerZone</Text>
        <Text style={styles.brandTagline}>Premium Multiplayer Poker</Text>
        <Text style={styles.brandCopyright}>No real money gambling</Text>
      </View>
    </ScrollView>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={settingStyles.row}>
      <View style={settingStyles.info}>
        <Text style={settingStyles.label}>{label}</Text>
        <Text style={settingStyles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.bgLight, true: Colors.primaryDark }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    marginRight: Spacing.md,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.bgMedium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  themeRow: {
    paddingVertical: Spacing.md,
  },
  themeLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  themeOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  themeIcon: {
    fontSize: 18,
  },
  themeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  themeTextActive: {
    color: Colors.primary,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aboutLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },
  aboutValue: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontFamily: 'monospace',
  },
  legalSection: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  legalLink: {
    paddingVertical: Spacing.sm,
  },
  legalText: {
    color: Colors.info,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  branding: {
    alignItems: 'center',
    marginTop: Spacing.huge,
    paddingVertical: Spacing.xxl,
  },
  brandText: {
    color: Colors.primary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandTagline: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
  brandCopyright: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.md,
    opacity: 0.5,
  },
});
