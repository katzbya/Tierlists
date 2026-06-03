// Image import + on-disk persistence.
//
// On native, picked images are copied into <documentDir>/images/<uuid>.jpg and
// we store ONLY the relative path "images/<uuid>.jpg" in the model. Absolute
// URIs are reconstructed at render time via resolveImageUri().
//
// On web, the file-system module is native-only, so we fall back to keeping the
// picked blob/object URL directly (persistence across reloads is not expected on
// web — web is only used for UI smoke-testing).

import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import type { Item } from '@/types/models';

const IMAGES_DIR = 'images';
const MAX_DIMENSION = 1024; // downscale longest edge to keep storage/memory sane.
const isWeb = Platform.OS === 'web';

function imagesDirectory(): Directory {
  return new Directory(Paths.document, IMAGES_DIR);
}

function ensureImagesDirectory(): void {
  const dir = imagesDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/** Build an absolute URI to render from a stored relative fileName. */
export function resolveImageUri(fileName: string): string {
  if (isWeb) return fileName; // already an absolute blob/object URL on web
  return new File(Paths.document, fileName).uri;
}

/** Delete an image file from disk; ignores missing files. */
export function deleteImageFile(fileName: string): void {
  if (isWeb) return;
  try {
    const file = new File(Paths.document, fileName);
    if (file.exists) file.delete();
  } catch {
    // best-effort cleanup; ignore.
  }
}

/**
 * Launch the photo library, copy each selected image into app storage, and
 * return new Item records. Returns [] if the user cancels or denies permission.
 */
export async function pickAndImportImages(): Promise<Item[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 1,
  });

  if (result.canceled || result.assets.length === 0) {
    return [];
  }

  if (!isWeb) {
    ensureImagesDirectory();
  }

  const items: Item[] = [];
  for (const asset of result.assets) {
    const id = Crypto.randomUUID();
    try {
      const processed = await downscale(asset.uri);
      let fileName: string;
      if (isWeb) {
        // Keep the (object/data) URL directly on web.
        fileName = processed.uri;
      } else {
        fileName = `${IMAGES_DIR}/${id}.jpg`;
        const src = new File(processed.uri);
        const dest = new File(Paths.document, fileName);
        if (dest.exists) dest.delete();
        await src.copy(dest);
      }
      items.push({
        id,
        fileName,
        width: processed.width,
        height: processed.height,
      });
    } catch {
      // Skip any single asset that fails to import rather than aborting all.
    }
  }
  return items;
}

/** Resize (longest edge -> MAX_DIMENSION) and compress to JPEG. */
async function downscale(
  uri: string
): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: 0.7, format: SaveFormat.JPEG }
  );
  return { uri: result.uri, width: result.width, height: result.height };
}
