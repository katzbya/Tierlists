// A card on the Home screen representing one saved tier list.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThumbImage } from '@/components/ThumbImage';
import { TierList } from '@/types/models';
import { palette } from '@/theme/colors';

interface Props {
  list: TierList;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const MAX_THUMBS = 5;

export function TierListCard({ list, onOpen, onEdit, onDelete }: Props) {
  const allItemIds = Object.keys(list.items);
  const thumbIds = allItemIds.slice(0, MAX_THUMBS);
  const itemCount = allItemIds.length;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {list.title}
        </Text>
      </View>

      <Text style={styles.meta}>
        {list.tiers.length} tiers · {itemCount}{' '}
        {itemCount === 1 ? 'photo' : 'photos'}
      </Text>

      <View style={styles.thumbRow}>
        {thumbIds.length === 0 ? (
          <Text style={styles.emptyThumb}>No photos yet</Text>
        ) : (
          thumbIds.map((id) => (
            <ThumbImage
              key={id}
              fileName={list.items[id].fileName}
              size={40}
              style={styles.thumb}
            />
          ))
        )}
        {itemCount > MAX_THUMBS ? (
          <Text style={styles.more}>+{itemCount - MAX_THUMBS}</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>Edit tiers</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  thumb: {
    borderRadius: 6,
  },
  emptyThumb: {
    color: palette.textMuted,
    fontStyle: 'italic',
    fontSize: 13,
  },
  more: {
    color: palette.textMuted,
    fontSize: 13,
    marginLeft: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 12,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  actionText: {
    color: palette.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteText: {
    color: palette.danger,
  },
});
