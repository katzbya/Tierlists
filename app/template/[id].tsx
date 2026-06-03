import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  EditableTier,
  TierEditorControls,
} from '@/components/TierEditorControls';
import { useTierStore } from '@/store/useTierStore';
import { colorForIndex, defaultTierSeed, palette } from '@/theme/colors';

function seedDefaults(): EditableTier[] {
  return defaultTierSeed.map((t) => ({ name: t.name, color: t.color }));
}

export default function TemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isNew = id === 'new';
  const existing = useTierStore((s) =>
    isNew ? undefined : s.lists.find((l) => l.id === id)
  );
  const createList = useTierStore((s) => s.createList);
  const updateTemplate = useTierStore((s) => s.updateTemplate);

  const initialTiers = useMemo<EditableTier[]>(() => {
    if (existing) {
      return existing.tiers.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));
    }
    return seedDefaults();
  }, [existing]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [tiers, setTiers] = useState<EditableTier[]>(initialTiers);

  const rename = (index: number, name: string) =>
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, name } : t)));

  const recolor = (index: number, color: string) =>
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, color } : t)));

  const move = (index: number, direction: -1 | 1) =>
    setTiers((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = prev.slice();
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });

  const remove = (index: number) =>
    setTiers((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );

  const add = () =>
    setTiers((prev) => [
      ...prev,
      { name: '', color: colorForIndex(prev.length) },
    ]);

  const save = () => {
    const cleaned = tiers.map((t, i) => ({
      id: t.id,
      name: t.name.trim() || `Tier ${i + 1}`,
      color: t.color,
    }));
    if (isNew) {
      const newId = createList(title, cleaned);
      router.replace(`/editor/${newId}`);
    } else if (existing) {
      updateTemplate(existing.id, title, cleaned);
      router.replace(`/editor/${existing.id}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{ title: isNew ? 'New tier list' : 'Edit template' }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="My tier list"
          placeholderTextColor={palette.textMuted}
          style={styles.titleInput}
          maxLength={60}
        />

        <Text style={[styles.label, styles.tierLabel]}>
          Tiers ({tiers.length})
        </Text>
        <Text style={styles.hint}>
          Rename, recolor, reorder, or add tiers. The top tier is the highest
          rank.
        </Text>

        <TierEditorControls
          tiers={tiers}
          onRename={rename}
          onRecolor={recolor}
          onMove={move}
          onRemove={remove}
          onAdd={add}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
        >
          <Text style={styles.saveText}>
            {isNew ? 'Create & add photos' : 'Save changes'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  label: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierLabel: {
    marginTop: 20,
  },
  hint: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  titleInput: {
    color: palette.text,
    fontSize: 16,
    backgroundColor: palette.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.background,
  },
  saveBtn: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
