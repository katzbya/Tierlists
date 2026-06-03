// Core data model for the tier-list app.
//
// IMPORTANT: `Item.fileName` is always a RELATIVE path (e.g. "images/ab12.jpg").
// We never persist absolute `file://` URIs because the iOS document directory
// path can change between app builds/installs. Resolve to an absolute URI at
// render time via `resolveImageUri()` in src/storage/images.ts.

export interface Item {
  id: string;
  /** Relative path under the document directory, e.g. "images/<uuid>.jpg". */
  fileName: string;
  width?: number;
  height?: number;
}

export interface Tier {
  id: string;
  name: string;
  /** Hex color, e.g. "#FF7F7F". */
  color: string;
  /** Ordered item ids placed in this tier. */
  itemIds: string[];
}

export interface TierList {
  id: string;
  title: string;
  /** Ordered top -> bottom. */
  tiers: Tier[];
  /** Canonical pool of all imported images, keyed by item id. */
  items: Record<string, Item>;
  /** Item ids not yet placed into a tier (the pool). */
  unrankedItemIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  schemaVersion: number;
  lists: TierList[];
}

export const SCHEMA_VERSION = 1;

/**
 * A drop zone id. The pool uses the constant POOL_ZONE; tiers use their tier id.
 */
export const POOL_ZONE = 'pool';
export type ZoneId = string; // either POOL_ZONE or a Tier.id
