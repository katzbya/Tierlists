import React, { useCallback } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TierListCard } from '@/components/TierListCard';
import { useTierStore } from '@/store/useTierStore';
import { palette } from '@/theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lists = useTierStore((s) => s.lists);
  const deleteList = useTierStore((s) => s.deleteList);

  const confirmDelete = useCallback(
    (id: string, title: string) => {
      const doDelete = () => deleteList(id);
      if (Platform.OS === 'web') {
        // Alert with buttons is a no-op on web; use confirm().
        // eslint-disable-next-line no-alert
        if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
          doDelete();
        }
        return;
      }
      Alert.alert(
        'Delete tier list',
        `Delete "${title}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    },
    [deleteList]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TierListCard
            list={item}
            onOpen={() => router.push(`/editor/${item.id}`)}
            onEdit={() => router.push(`/template/${item.id}`)}
            onDelete={() => confirmDelete(item.id, item.title)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tier lists yet</Text>
            <Text style={styles.emptyBody}>
              Create a template, choose your tiers, then add photos to rank.
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => router.push('/template/new')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 20 },
          pressed && styles.fabPressed,
        ]}
      >
        <Text style={styles.fabText}>+ New tier list</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: palette.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
