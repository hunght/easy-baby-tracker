import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

export const DATABASE_NAME = 'babyease.db';

export const expoDb = openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: false, // https://expo.dev/blog/modern-sqlite-for-react-native-apps we don't need change listener
});
export const db = drizzle(expoDb);
