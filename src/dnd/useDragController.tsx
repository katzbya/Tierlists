// Drag-and-drop controller shared across the tier board.
//
// Responsibilities:
//  - Let each drop zone (pool + tier rows) register a measurable View ref.
//  - Let each draggable item report its layout (relative to its zone).
//  - Provide Reanimated shared values that drive the floating DragOverlay.
//  - On drop, hit-test the finger against snapshotted zone frames and compute
//    the target zone + insertion index (all pure math in dnd/geometry.ts).
//
// Zone frames are snapshotted in window coordinates when a drag begins (the
// board does not scroll mid-drag), so release-time targeting stays accurate.

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { useSharedValue, SharedValue } from 'react-native-reanimated';
import {
  findZoneAtPoint,
  insertionIndexFromPoint,
  Point,
  ZoneFrame,
} from '@/dnd/geometry';
import { ZoneId } from '@/types/models';

export const ITEM_SIZE = 64;
export const ITEM_GAP = 6;

interface ItemLayout {
  zoneId: ZoneId;
  x: number; // relative to its zone container
  y: number;
  width: number;
  height: number;
}

export interface DropResult {
  zoneId: ZoneId;
  index: number;
}

interface DragContextValue {
  // Reanimated values driving the overlay (window coords of the finger).
  fingerX: SharedValue<number>;
  fingerY: SharedValue<number>;
  isDragging: SharedValue<number>; // 0 | 1

  // Which item is being dragged (for overlay content + dimming the source).
  draggingItemId: string | null;
  activeZoneId: ZoneId | null;

  registerZone: (zoneId: ZoneId, ref: View | null) => void;
  reportItemLayout: (itemId: string, layout: ItemLayout) => void;
  clearItemLayout: (itemId: string) => void;

  // Called from the gesture (already on the JS thread via runOnJS).
  beginDrag: (itemId: string) => void;
  updateActiveZone: (x: number, y: number) => void;
  endDrag: (
    x: number,
    y: number,
    orderedItemIdsByZone: (zoneId: ZoneId) => string[]
  ) => DropResult | null;
  cancelDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const isDragging = useSharedValue(0);

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<ZoneId | null>(null);

  const zoneRefs = useRef<Map<ZoneId, View>>(new Map());
  const frameSnapshot = useRef<ZoneFrame[]>([]);
  const itemLayouts = useRef<Map<string, ItemLayout>>(new Map());

  const registerZone = useCallback((zoneId: ZoneId, ref: View | null) => {
    if (ref) zoneRefs.current.set(zoneId, ref);
    else zoneRefs.current.delete(zoneId);
  }, []);

  const reportItemLayout = useCallback(
    (itemId: string, layout: ItemLayout) => {
      itemLayouts.current.set(itemId, layout);
    },
    []
  );

  const clearItemLayout = useCallback((itemId: string) => {
    itemLayouts.current.delete(itemId);
  }, []);

  const snapshotFrames = useCallback(() => {
    const frames: ZoneFrame[] = [];
    zoneRefs.current.forEach((ref, zoneId) => {
      ref.measureInWindow((x, y, width, height) => {
        // Replace any prior frame for this zone, then keep the array fresh.
        const existing = frames.findIndex((f) => f.zoneId === zoneId);
        const frame: ZoneFrame = { zoneId, x, y, width, height };
        if (existing >= 0) frames[existing] = frame;
        else frames.push(frame);
      });
    });
    frameSnapshot.current = frames;
  }, []);

  const beginDrag = useCallback(
    (itemId: string) => {
      snapshotFrames();
      setDraggingItemId(itemId);
    },
    [snapshotFrames]
  );

  const updateActiveZone = useCallback((x: number, y: number) => {
    const zoneId = findZoneAtPoint({ x, y }, frameSnapshot.current);
    setActiveZoneId(zoneId);
  }, []);

  const endDrag = useCallback(
    (
      x: number,
      y: number,
      orderedItemIdsByZone: (zoneId: ZoneId) => string[]
    ): DropResult | null => {
      const point: Point = { x, y };
      const zoneId = findZoneAtPoint(point, frameSnapshot.current);
      setDraggingItemId(null);
      setActiveZoneId(null);
      if (!zoneId) return null;

      const frame = frameSnapshot.current.find((f) => f.zoneId === zoneId);
      if (!frame) return { zoneId, index: 0 };

      // Build ordered, zone-relative slot centers (excluding the dragged item).
      const ids = orderedItemIdsByZone(zoneId).filter(
        (id) => id !== draggingItemId
      );
      const centers: Point[] = [];
      for (const id of ids) {
        const layout = itemLayouts.current.get(id);
        if (!layout) continue;
        centers.push({
          x: layout.x + layout.width / 2,
          y: layout.y + layout.height / 2,
        });
      }
      const relative: Point = { x: x - frame.x, y: y - frame.y };
      const index = insertionIndexFromPoint(relative, centers);
      return { zoneId, index };
    },
    [draggingItemId]
  );

  const cancelDrag = useCallback(() => {
    setDraggingItemId(null);
    setActiveZoneId(null);
  }, []);

  const value = useMemo<DragContextValue>(
    () => ({
      fingerX,
      fingerY,
      isDragging,
      draggingItemId,
      activeZoneId,
      registerZone,
      reportItemLayout,
      clearItemLayout,
      beginDrag,
      updateActiveZone,
      endDrag,
      cancelDrag,
    }),
    [
      fingerX,
      fingerY,
      isDragging,
      draggingItemId,
      activeZoneId,
      registerZone,
      reportItemLayout,
      clearItemLayout,
      beginDrag,
      updateActiveZone,
      endDrag,
      cancelDrag,
    ]
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDragController(): DragContextValue {
  const ctx = useContext(DragContext);
  if (!ctx) {
    throw new Error('useDragController must be used within a DragProvider');
  }
  return ctx;
}
