// Persists the whole AppData blob (all tier lists) as JSON in AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, SCHEMA_VERSION, TierList } from '@/types/models';

const STORAGE_KEY = '@tierlists/v1';

const emptyData: AppData = { schemaVersion: SCHEMA_VERSION, lists: [] };

/** Load and migrate AppData. Never throws — returns empty data on any error. */
export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyData };
    const parsed = JSON.parse(raw) as AppData;
    return migrate(parsed);
  } catch {
    return { ...emptyData };
  }
}

/** Persist the list of tier lists. */
export async function saveLists(lists: TierList[]): Promise<void> {
  const data: AppData = { schemaVersion: SCHEMA_VERSION, lists };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Forward-migrate older payloads. Currently only v1 exists, so this just
 * normalizes shape and stamps the current version for future-proofing.
 */
function migrate(data: AppData): AppData {
  if (!data || !Array.isArray(data.lists)) {
    return { ...emptyData };
  }
  // Future migrations keyed on data.schemaVersion go here.
  return { schemaVersion: SCHEMA_VERSION, lists: data.lists };
}
