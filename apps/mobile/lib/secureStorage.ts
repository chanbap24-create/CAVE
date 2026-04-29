import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure storage adapter for Supabase auth tokens.
 *
 * Stores JWT in expo-secure-store (iOS Keychain / Android EncryptedSharedPreferences).
 * SecureStore has a ~2048 byte limit per item; when the value exceeds that, we
 * chunk it across multiple keys. On read, we reassemble transparently.
 *
 * Migration: reads legacy tokens from AsyncStorage once, then moves them to
 * SecureStore. Avoids forced re-login on upgrade.
 */

const CHUNK_SIZE = 1800;
const CHUNK_HEADER_SUFFIX = '__chunks';

async function clearChunks(key: string) {
  try {
    const header = await SecureStore.getItemAsync(`${key}${CHUNK_HEADER_SUFFIX}`);
    if (header != null) {
      const count = parseInt(header, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}__${i}`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(`${key}${CHUNK_HEADER_SUFFIX}`).catch(() => {});
    }
  } catch {
    // ignore
  }
}

async function readFromSecure(key: string): Promise<string | null> {
  try {
    const header = await SecureStore.getItemAsync(`${key}${CHUNK_HEADER_SUFFIX}`);
    if (header == null) {
      // Single-key path
      return await SecureStore.getItemAsync(key);
    }
    const count = parseInt(header, 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}__${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  } catch {
    return null;
  }
}

async function writeToSecure(key: string, value: string): Promise<void> {
  await clearChunks(key);
  await SecureStore.deleteItemAsync(key).catch(() => {});

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  for (let i = 0; i < chunks.length; i++) {
    await SecureStore.setItemAsync(`${key}__${i}`, chunks[i]);
  }
  await SecureStore.setItemAsync(`${key}${CHUNK_HEADER_SUFFIX}`, String(chunks.length));
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const fromSecure = await readFromSecure(key);
    if (fromSecure !== null) return fromSecure;

    // Migrate legacy AsyncStorage value, if present
    try {
      const legacy = await AsyncStorage.getItem(key);
      if (legacy !== null) {
        await writeToSecure(key, legacy);
        await AsyncStorage.removeItem(key).catch(() => {});
        return legacy;
      }
    } catch {
      // ignore migration failure
    }

    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await writeToSecure(key, value);
    } catch {
      // If SecureStore is unavailable for some reason, fall back to AsyncStorage
      // rather than breaking the auth flow entirely.
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    await clearChunks(key);
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
  },
};
