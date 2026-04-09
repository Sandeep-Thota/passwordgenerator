// ==========================================
// PokerZone - Async Storage Utilities
// ==========================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// ==========================================
// Helper Functions
// ==========================================

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    const json = JSON.stringify(value);
    await AsyncStorage.setItem(key, json);
  } catch (error) {
    console.error(`[Storage] Failed to save key "${key}":`, error);
  }
}

export async function loadFromStorage<T>(key: string): Promise<T | null> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json != null ? (JSON.parse(json) as T) : null;
  } catch (error) {
    console.error(`[Storage] Failed to load key "${key}":`, error);
    return null;
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove key "${key}":`, error);
  }
}

// ==========================================
// Zustand Persist Storage Adapter
// ==========================================

export const zustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};
