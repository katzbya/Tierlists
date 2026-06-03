// Bridges the zustand store to AsyncStorage: hydrate on startup, debounce saves
// on change, and flush when the app goes to the background.

import { AppState, AppStateStatus } from 'react-native';
import { useTierStore } from '@/store/useTierStore';
import { loadAppData, saveLists } from '@/storage/metadata';
import { TierList } from '@/types/models';

const SAVE_DEBOUNCE_MS = 500;

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingLists: TierList[] | null = null;
let initialized = false;

function flushNow(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (pendingLists) {
    const toSave = pendingLists;
    pendingLists = null;
    void saveLists(toSave);
  }
}

function scheduleSave(lists: TierList[]): void {
  pendingLists = lists;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushNow, SAVE_DEBOUNCE_MS);
}

/** Load persisted data into the store. Call once on app start. */
export async function hydrateStore(): Promise<void> {
  const data = await loadAppData();
  useTierStore.getState().setLists(data.lists);
  useTierStore.getState().setHydrated(true);
}

/** Wire up auto-save subscriptions. Call once on app start. */
export function initPersistence(): () => void {
  if (initialized) return () => {};
  initialized = true;

  const unsubscribe = useTierStore.subscribe((state, prev) => {
    if (!state.hydrated) return; // don't save the initial empty state pre-hydrate
    if (state.lists !== prev.lists) {
      scheduleSave(state.lists);
    }
  });

  const handleAppState = (status: AppStateStatus) => {
    if (status === 'background' || status === 'inactive') {
      flushNow();
    }
  };
  const sub = AppState.addEventListener('change', handleAppState);

  return () => {
    unsubscribe();
    sub.remove();
    flushNow();
  };
}
