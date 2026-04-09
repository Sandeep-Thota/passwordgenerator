// ==========================================
// PokerZone - Root Layout
// ==========================================

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { playerName } = useAuthStore();
  const isNewUser = !playerName;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bgDark },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.bgDarkest },
          animation: 'slide_from_right',
        }}
        initialRouteName={isNewUser ? 'welcome' : '(tabs)'}
      >
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="create-room"
          options={{
            title: 'Create Table',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="solo-play"
          options={{
            title: 'Solo Play',
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="game/[id]"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDarkest,
  },
});
