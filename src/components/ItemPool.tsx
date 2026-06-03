// The pool of unranked photos at the bottom of the editor. It is itself a drop
// zone (POOL_ZONE) so items can be dragged back out of tiers, and hosts the
// "Add photos" button.

import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DraggableItem } from '@/components/DraggableItem';
import { ITEM_GAP, ITEM_SIZE, useDragController } from '@/dnd/useDragController';
import { Item, POOL_ZONE } from '@/types/models';
import { palette } from '@/theme/colors';

interface Props {
  unrankedItemIds: string[];
  items: Record<string, Item>;
  listId: string;
  onAddPhotos: () => void;
  adding: boolean;
}

export function ItemPool({
  unrankedItemIds,
  items,
  listId,
  onAddPhotos,
  adding,
}: Props) {
  const { registerZone, activeZoneId } = useDragController();

  const setRef = useCallback(
    (node: View | null) => registerZone(POOL_ZONE, node),
    [registerZone]
  );

  const isActive = activeZoneId === POOL_ZONE;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Unranked {unrankedItemIds.length > 0 ? `(${unrankedItemIds.length})` : ''}
        </Text>
        <Pressable
          onPress={onAddPhotos}
          disabled={adding}
          style={({ pressed }) => [
            styles.addBtn,
            pressed && styles.addBtnPressed,
            adding && styles.addBtnDisabled,
          ]}
        >
          <Text style={styles.addBtnText}>
            {adding ? 'Adding…' : '+ Add photos'}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View ref={setRef} style={[styles.lane, isActive && styles.laneActive]}>
          {unrankedItemIds.length === 0 ? (
            <Text style={styles.emptyText}>
              Tap “Add photos”, then long-press a photo to drag it into a tier.
            </Text>
          ) : (
            unrankedItemIds.map((id) => {
              const item = items[id];
              if (!item) return null;
              return (
                <DraggableItem
                  key={item.id}
                  item={item}
                  zoneId={POOL_ZONE}
                  listId={listId}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.background,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnPressed: {
    opacity: 0.8,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    flexGrow: 1,
  },
  lane: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ITEM_GAP,
    paddingHorizontal: 12,
    minHeight: ITEM_SIZE + 16,
    minWidth: '100%',
  },
  laneActive: {
    backgroundColor: palette.surface,
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: 13,
    flexShrink: 1,
    paddingVertical: 12,
  },
});
