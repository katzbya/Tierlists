// Full-window, non-interactive overlay that renders a "ghost" of the item being
// dragged. Position is driven entirely by Reanimated shared values on the UI
// thread, so it tracks the finger at 60fps regardless of list re-renders.
//
// Must be mounted at a container whose top-left aligns with the window origin,
// because finger coordinates are in window space.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ITEM_SIZE, useDragController } from '@/dnd/useDragController';
import { useTierStore } from '@/store/useTierStore';
import { ThumbImage } from '@/components/ThumbImage';

interface Props {
  listId: string;
}

export function DragOverlay({ listId }: Props) {
  const { fingerX, fingerY, isDragging, draggingItemId } = useDragController();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isDragging.value,
    transform: [
      { translateX: fingerX.value - ITEM_SIZE / 2 },
      { translateY: fingerY.value - ITEM_SIZE / 2 },
      { scale: isDragging.value ? 1.12 : 1 },
    ],
  }));

  const item = draggingItemId
    ? useTierStore.getState().getList(listId)?.items[draggingItemId]
    : undefined;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.ghost, animatedStyle]}>
        {item ? (
          <ThumbImage fileName={item.fileName} size={ITEM_SIZE} style={styles.image} />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  image: {
    borderRadius: 8,
  },
});
