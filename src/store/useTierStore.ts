// Central app state: all tier lists + CRUD + the drag-and-drop moveItem action.
//
// Mutations produce new immutable objects so zustand selectors re-render only
// what changed. Persistence is wired separately in src/store/persist.ts, which
// subscribes to this store and debounces writes to AsyncStorage.

import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { Item, POOL_ZONE, Tier, TierList, ZoneId } from '@/types/models';
import { deleteImageFile } from '@/storage/images';

export interface TierTemplateInput {
  name: string;
  color: string;
}

interface TierStoreState {
  lists: TierList[];
  hydrated: boolean;

  setLists: (lists: TierList[]) => void;
  setHydrated: (v: boolean) => void;

  getList: (id: string) => TierList | undefined;
  createList: (title: string, tiers: TierTemplateInput[]) => string;
  updateTemplate: (
    id: string,
    title: string,
    tiers: { id?: string; name: string; color: string }[]
  ) => void;
  deleteList: (id: string) => void;

  addImages: (listId: string, items: Item[]) => void;
  removeItem: (listId: string, itemId: string) => void;
  moveItem: (
    listId: string,
    itemId: string,
    toZone: ZoneId,
    index: number
  ) => void;
}

function now(): number {
  return Date.now();
}

/** Remove an itemId from every zone (pool + all tiers) of a list. */
function removeItemFromZones(list: TierList, itemId: string): TierList {
  return {
    ...list,
    unrankedItemIds: list.unrankedItemIds.filter((id) => id !== itemId),
    tiers: list.tiers.map((t) => ({
      ...t,
      itemIds: t.itemIds.filter((id) => id !== itemId),
    })),
  };
}

export const useTierStore = create<TierStoreState>((set, get) => ({
  lists: [],
  hydrated: false,

  setLists: (lists) => set({ lists }),
  setHydrated: (v) => set({ hydrated: v }),

  getList: (id) => get().lists.find((l) => l.id === id),

  createList: (title, tiers) => {
    const id = Crypto.randomUUID();
    const list: TierList = {
      id,
      title: title.trim() || 'Untitled tier list',
      tiers: tiers.map((t) => ({
        id: Crypto.randomUUID(),
        name: t.name,
        color: t.color,
        itemIds: [],
      })),
      items: {},
      unrankedItemIds: [],
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ lists: [list, ...s.lists] }));
    return id;
  },

  updateTemplate: (id, title, tiers) => {
    set((s) => ({
      lists: s.lists.map((list) => {
        if (list.id !== id) return list;

        // Build the new tier set, preserving items for tiers that still exist.
        const oldById = new Map(list.tiers.map((t) => [t.id, t]));
        const keptTierIds = new Set<string>();
        const newTiers: Tier[] = tiers.map((t) => {
          const existing = t.id ? oldById.get(t.id) : undefined;
          if (existing) {
            keptTierIds.add(existing.id);
            return { ...existing, name: t.name, color: t.color };
          }
          return {
            id: Crypto.randomUUID(),
            name: t.name,
            color: t.color,
            itemIds: [],
          };
        });

        // Any items that lived in a removed tier go back to the pool.
        const orphaned: string[] = [];
        for (const t of list.tiers) {
          if (!keptTierIds.has(t.id)) orphaned.push(...t.itemIds);
        }

        return {
          ...list,
          title: title.trim() || list.title,
          tiers: newTiers,
          unrankedItemIds: [...list.unrankedItemIds, ...orphaned],
          updatedAt: now(),
        };
      }),
    }));
  },

  deleteList: (id) => {
    const list = get().lists.find((l) => l.id === id);
    if (list) {
      for (const item of Object.values(list.items)) {
        deleteImageFile(item.fileName);
      }
    }
    set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
  },

  addImages: (listId, items) => {
    if (items.length === 0) return;
    set((s) => ({
      lists: s.lists.map((list) => {
        if (list.id !== listId) return list;
        const nextItems = { ...list.items };
        for (const it of items) nextItems[it.id] = it;
        return {
          ...list,
          items: nextItems,
          unrankedItemIds: [...list.unrankedItemIds, ...items.map((i) => i.id)],
          updatedAt: now(),
        };
      }),
    }));
  },

  removeItem: (listId, itemId) => {
    set((s) => ({
      lists: s.lists.map((list) => {
        if (list.id !== listId) return list;
        const item = list.items[itemId];
        if (item) deleteImageFile(item.fileName);
        const stripped = removeItemFromZones(list, itemId);
        const nextItems = { ...stripped.items };
        delete nextItems[itemId];
        return { ...stripped, items: nextItems, updatedAt: now() };
      }),
    }));
  },

  moveItem: (listId, itemId, toZone, index) => {
    set((s) => ({
      lists: s.lists.map((list) => {
        if (list.id !== listId) return list;
        if (!list.items[itemId]) return list;

        const stripped = removeItemFromZones(list, itemId);
        const clampedInsert = (arr: string[]) => {
          const i = Math.max(0, Math.min(index, arr.length));
          const copy = arr.slice();
          copy.splice(i, 0, itemId);
          return copy;
        };

        if (toZone === POOL_ZONE) {
          return {
            ...stripped,
            unrankedItemIds: clampedInsert(stripped.unrankedItemIds),
            updatedAt: now(),
          };
        }
        return {
          ...stripped,
          tiers: stripped.tiers.map((t) =>
            t.id === toZone ? { ...t, itemIds: clampedInsert(t.itemIds) } : t
          ),
          updatedAt: now(),
        };
      }),
    }));
  },
}));
