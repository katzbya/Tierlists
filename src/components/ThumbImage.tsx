// Renders a stored item image by resolving its relative fileName to an absolute
// URI at render time (see src/storage/images.ts for the why).

import React from 'react';
import { Image } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';
import { resolveImageUri } from '@/storage/images';

interface Props {
  fileName: string;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function ThumbImage({ fileName, size, style }: Props) {
  const uri = resolveImageUri(fileName);
  return (
    <Image
      source={{ uri }}
      style={[size ? { width: size, height: size } : undefined, style]}
      contentFit="cover"
      transition={120}
    />
  );
}
