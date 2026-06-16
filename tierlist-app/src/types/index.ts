export interface TierList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Tier {
  id: string;
  tier_list_id: string;
  label: string;
  color: string;
  position: number;
}

export interface Image {
  id: string;
  user_id: string;
  name: string;
  storage_path: string;
  created_at: string;
}

export interface TierItem {
  id: string;
  tier_list_id: string;
  tier_id: string | null; // null = in pool
  image_id: string;
  position: number;
  image?: Image;
}

export interface TierWithItems extends Tier {
  items: TierItem[];
}

export interface EditorState {
  tierList: TierList;
  tiers: TierWithItems[];
  pool: TierItem[];
  images: Record<string, Image>;
}

export const DEFAULT_TIERS = [
  { label: "S", color: "#FF7F7F" },
  { label: "A", color: "#FFBF7F" },
  { label: "B", color: "#FFDF7F" },
  { label: "C", color: "#FFFF7F" },
  { label: "D", color: "#7FFF7F" },
  { label: "F", color: "#7F7FFF" },
];

export const TIER_COLORS = [
  "#FF7F7F", "#FF9F7F", "#FFBF7F", "#FFDF7F", "#FFFF7F",
  "#BFFF7F", "#7FFF7F", "#7FFFBF", "#7FFFFF", "#7FBFFF",
  "#7F7FFF", "#BF7FFF", "#FF7FFF", "#FF7FBF", "#AAAAAA",
];
