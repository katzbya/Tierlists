// A single draggable thumbnail. Long-press to lift, then drag onto any tier or
// the pool. The floating ghost is rendered separately by DragOverlay; this
// component just drives the gesture and reports its layout for drop targeting.

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { ThumbImage } from '@/components/ThumbImage';
import { ITEM_SIZE, useDragController } from '@/dnd/useDragController';
import { useTierStore } from '@/store/useTierStore';
import { Item, POOL_ZONE, ZoneId } from '@/types/models';
import { palette } from '@/theme/colors';

interface Props {
  item: Item;
  zoneId: ZoneId;
  listId: string;
}

export function DraggableItem({ item, zoneId, listId }: Props) {
  const {
    fingerX,
    fingerY,
    isDragging,
    draggingItemId,
    reportItemLayout,
    beginDrag,
    endDrag,
  } = useDragController();

  const handleDrop = useCallback(
    (x: number, y: number) => {
      const orderedItemIdsByZone = (zid: ZoneId): string[] => {
        const list = useTierStore.getState().getList(listId);
        if (!list) return [];
        if (zid === POOL_ZONE) return list.unrankedItemIds;
        const tier = list.tiers.find((t) => t.id === zid);
        return tier ? tier.itemIds : [];
      };
      const result = endDrag(x, y, orderedItemIdsByZone);
      if (result) {
        useTierStore
          .getState()
          .moveItem(listId, item.id, result.zoneId, result.index);
      }
    },
    [endDrag, item.id, listId]
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(160)
    .onStart((e) => {
      isDragging.value = 1;
      fingerX.value = e.absoluteX;
      fingerY.value = e.absoluteY;
      runOnJS(beginDrag)(item.id);
    })
    .onUpdate((e) => {
      fingerX.value = e.absoluteX;
      fingerY.value = e.absoluteY;
    })
    .onEnd((e) => {
      isDragging.value = 0;
      runOnJS(handleDrop)(e.absoluteX, e.absoluteY);
    })
    .onFinalize(() => {
      isDragging.value = 0;
    });

  const isBeingDragged = draggingItemId === item.id;

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          reportItemLayout(item.id, { zoneId, x, y, width, height });
        }}
        style={[styles.item, isBeingDragged && styles.dragging]}
      >
        <ThumbImage fileName={item.fileName} size={ITEM_SIZE} style={styles.image} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  image: {
    borderRadius: 8,
  },
  dragging: {
    opacity: 0.25,
  },
});
