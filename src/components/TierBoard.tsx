// Orchestrates the editor: scrollable stack of tier rows, the unranked pool, and
// the floating drag overlay. Subscribes to a single tier list from the store.

import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { TierRow } from '@/components/TierRow';
import { ItemPool } from '@/components/ItemPool';
import { DragOverlay } from '@/components/DragOverlay';
import { useTierStore } from '@/store/useTierStore';
import { pickAndImportImages } from '@/storage/images';
import { palette } from '@/theme/colors';

interface Props {
  listId: string;
}

export function TierBoard({ listId }: Props) {
  const list = useTierStore((s) => s.lists.find((l) => l.id === listId));
  const addImages = useTierStore((s) => s.addImages);
  const [adding, setAdding] = useState(false);

  const onAddPhotos = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      const items = await pickAndImportImages();
      if (items.length > 0) {
        addImages(listId, items);
      } else if (Platform.OS !== 'web') {
        // No items: either cancelled or permission denied — stay quiet on cancel.
      }
    } catch {
      Alert.alert('Could not add photos', 'Something went wrong importing images.');
    } finally {
      setAdding(false);
    }
  }, [adding, addImages, listId]);

  if (!list) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.board}
        contentContainerStyle={styles.boardContent}
        keyboardShouldPersistTaps="handled"
      >
        {list.tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            items={list.items}
            listId={listId}
          />
        ))}
      </ScrollView>

      <ItemPool
        unrankedItemIds={list.unrankedItemIds}
        items={list.items}
        listId={listId}
        onAddPhotos={onAddPhotos}
        adding={adding}
      />

      <DragOverlay listId={listId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  board: {
    flex: 1,
  },
  boardContent: {
    paddingBottom: 8,
  },
});
