// One tier: a colored label cell on the left and a wrapping "lane" of items on
// the right. The lane View is registered as a drop zone (its id is the tier id).

import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DraggableItem } from '@/components/DraggableItem';
import { ITEM_GAP, ITEM_SIZE, useDragController } from '@/dnd/useDragController';
import { Item, Tier } from '@/types/models';
import { contrastText, palette } from '@/theme/colors';

interface Props {
  tier: Tier;
  items: Record<string, Item>;
  listId: string;
}

export function TierRow({ tier, items, listId }: Props) {
  const { registerZone, activeZoneId } = useDragController();

  const setRef = useCallback(
    (node: View | null) => registerZone(tier.id, node),
    [registerZone, tier.id]
  );

  const isActive = activeZoneId === tier.id;

  return (
    <View style={styles.row}>
      <View style={[styles.label, { backgroundColor: tier.color }]}>
        <Text
          style={[styles.labelText, { color: contrastText(tier.color) }]}
          numberOfLines={2}
        >
          {tier.name}
        </Text>
      </View>
      <View ref={setRef} style={[styles.lane, isActive && styles.laneActive]}>
        {tier.itemIds.map((id) => {
          const item = items[id];
          if (!item) return null;
          return (
            <DraggableItem
              key={item.id}
              item={item}
              zoneId={tier.id}
              listId={listId}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    minHeight: ITEM_SIZE + 16,
  },
  label: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  labelText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  lane: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: ITEM_GAP,
    padding: 8,
    backgroundColor: palette.surface,
  },
  laneActive: {
    backgroundColor: palette.surfaceAlt,
  },
});
