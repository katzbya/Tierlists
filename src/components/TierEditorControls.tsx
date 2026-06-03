// Editable list of tiers for the template screen: rename, recolor (preset
// palette), reorder via up/down, remove, and add a new tier.

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { contrastText, palette, tierColors } from '@/theme/colors';

export interface EditableTier {
  id?: string;
  name: string;
  color: string;
}

interface Props {
  tiers: EditableTier[];
  onRename: (index: number, name: string) => void;
  onRecolor: (index: number, color: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}

export function TierEditorControls({
  tiers,
  onRename,
  onRecolor,
  onMove,
  onRemove,
  onAdd,
}: Props) {
  return (
    <View>
      {tiers.map((tier, index) => (
        <View key={tier.id ?? `new-${index}`} style={styles.tierCard}>
          <View style={styles.topRow}>
            <View
              style={[styles.swatch, { backgroundColor: tier.color }]}
            >
              <Text style={[styles.swatchText, { color: contrastText(tier.color) }]}>
                {tier.name.trim().slice(0, 2) || '?'}
              </Text>
            </View>
            <TextInput
              value={tier.name}
              onChangeText={(t) => onRename(index, t)}
              placeholder={`Tier ${index + 1} name`}
              placeholderTextColor={palette.textMuted}
              style={styles.nameInput}
              maxLength={24}
            />
            <View style={styles.reorder}>
              <Pressable
                onPress={() => onMove(index, -1)}
                disabled={index === 0}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.iconBtn,
                  (pressed || index === 0) && styles.iconBtnDim,
                ]}
              >
                <Text style={styles.iconText}>↑</Text>
              </Pressable>
              <Pressable
                onPress={() => onMove(index, 1)}
                disabled={index === tiers.length - 1}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.iconBtn,
                  (pressed || index === tiers.length - 1) && styles.iconBtnDim,
                ]}
              >
                <Text style={styles.iconText}>↓</Text>
              </Pressable>
              <Pressable
                onPress={() => onRemove(index)}
                disabled={tiers.length <= 1}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.iconBtn,
                  (pressed || tiers.length <= 1) && styles.iconBtnDim,
                ]}
              >
                <Text style={[styles.iconText, styles.removeText]}>✕</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.colorRow}>
            {tierColors.map((color) => {
              const selected = color.toLowerCase() === tier.color.toLowerCase();
              return (
                <Pressable
                  key={color}
                  onPress={() => onRecolor(index, color)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selected && styles.colorDotSelected,
                  ]}
                />
              );
            })}
          </View>
        </View>
      ))}

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addTier, pressed && styles.pressed]}
      >
        <Text style={styles.addTierText}>+ Add tier</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tierCard: {
    backgroundColor: palette.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchText: {
    fontWeight: '800',
    fontSize: 15,
  },
  nameInput: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: palette.background,
    borderRadius: 8,
  },
  reorder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceAlt,
  },
  iconBtnDim: {
    opacity: 0.35,
  },
  iconText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
  },
  removeText: {
    color: palette.danger,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: palette.text,
  },
  addTier: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  addTierText: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 15,
  },
});
