import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { TierBoard } from '@/components/TierBoard';
import { DragProvider } from '@/dnd/useDragController';
import { useTierStore } from '@/store/useTierStore';
import { palette } from '@/theme/colors';

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const list = useTierStore((s) => s.lists.find((l) => l.id === id));

  if (!list) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={styles.missingText}>This tier list no longer exists.</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.link}>Back to home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: list.title,
          headerRight: () => (
            <Pressable
              hitSlop={8}
              onPress={() => router.push(`/template/${list.id}`)}
            >
              <Text style={styles.headerBtn}>Edit tiers</Text>
            </Pressable>
          ),
        }}
      />
      <DragProvider>
        <TierBoard listId={list.id} />
      </DragProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  headerBtn: {
    color: palette.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    gap: 12,
  },
  missingText: {
    color: palette.text,
    fontSize: 16,
  },
  link: {
    color: palette.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
