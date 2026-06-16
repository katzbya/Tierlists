import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_TIERS, type TierList, type Tier, type TierItem, type Image, type TierWithItems } from "@/types";

// Lazily create the client so module evaluation at build time doesn't fail
function db() { return createClient(); }

// ─── Tier Lists ───────────────────────────────────────────────────────────────

export async function getTierLists(userId: string): Promise<TierList[]> {
  const { data, error } = await db()
    .from("tier_lists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTierList(userId: string, name: string): Promise<TierList> {
  const tierListId = uuidv4();

  const { data: tierList, error: tlError } = await db()
    .from("tier_lists")
    .insert({ id: tierListId, user_id: userId, name })
    .select()
    .single();
  if (tlError) throw tlError;

  const tiers = DEFAULT_TIERS.map((t, i) => ({
    id: uuidv4(),
    tier_list_id: tierListId,
    label: t.label,
    color: t.color,
    position: i,
  }));

  const { error: tiersError } = await db().from("tiers").insert(tiers);
  if (tiersError) throw tiersError;

  return tierList;
}

export async function deleteTierList(id: string): Promise<void> {
  const { error } = await db().from("tier_lists").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateTierList(id: string, userId: string): Promise<TierList> {
  const supabase = db();
  const { data: original, error: e1 } = await supabase
    .from("tier_lists").select("*").eq("id", id).single();
  if (e1) throw e1;

  const { data: originalTiers, error: e2 } = await supabase
    .from("tiers").select("*").eq("tier_list_id", id);
  if (e2) throw e2;

  const { data: originalItems, error: e3 } = await supabase
    .from("tier_items").select("*").eq("tier_list_id", id);
  if (e3) throw e3;

  const newListId = uuidv4();
  const { data: newList, error: e4 } = await supabase
    .from("tier_lists")
    .insert({ id: newListId, user_id: userId, name: `${original.name} (copy)` })
    .select().single();
  if (e4) throw e4;

  const tierIdMap: Record<string, string> = {};
  const newTiers = originalTiers.map((t: Tier) => {
    const newId = uuidv4();
    tierIdMap[t.id] = newId;
    return { ...t, id: newId, tier_list_id: newListId };
  });
  await supabase.from("tiers").insert(newTiers);

  if (originalItems.length > 0) {
    const newItems = originalItems.map((item: TierItem) => ({
      ...item,
      id: uuidv4(),
      tier_list_id: newListId,
      tier_id: item.tier_id ? tierIdMap[item.tier_id] : null,
    }));
    await supabase.from("tier_items").insert(newItems);
  }

  return newList;
}

// ─── Editor Load ──────────────────────────────────────────────────────────────

export async function loadEditor(tierListId: string) {
  const supabase = db();
  const [{ data: tierList }, { data: tiers }, { data: items }] = await Promise.all([
    supabase.from("tier_lists").select("*").eq("id", tierListId).single(),
    supabase.from("tiers").select("*").eq("tier_list_id", tierListId).order("position"),
    supabase.from("tier_items").select("*, image:images(*)").eq("tier_list_id", tierListId).order("position"),
  ]);

  const imageMap: Record<string, Image> = {};
  (items || []).forEach((item: TierItem & { image: Image }) => {
    if (item.image) imageMap[item.image_id] = item.image;
  });

  const tiersWithItems: TierWithItems[] = (tiers || []).map((tier: Tier) => ({
    ...tier,
    items: (items || []).filter((i: TierItem) => i.tier_id === tier.id),
  }));

  const pool = (items || []).filter((i: TierItem) => i.tier_id === null);

  return { tierList, tiers: tiersWithItems, pool, images: imageMap };
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

export async function saveTiers(tiers: Tier[]): Promise<void> {
  const { error } = await db()
    .from("tiers")
    .upsert(tiers, { onConflict: "id" });
  if (error) throw error;
}

export async function addTier(tierListId: string, position: number): Promise<Tier> {
  const { data, error } = await db()
    .from("tiers")
    .insert({ id: uuidv4(), tier_list_id: tierListId, label: "New", color: "#AAAAAA", position })
    .select().single();
  if (error) throw error;
  return data;
}

export async function deleteTier(tierId: string, tierListId: string): Promise<void> {
  const supabase = db();
  await supabase.from("tier_items")
    .update({ tier_id: null })
    .eq("tier_id", tierId)
    .eq("tier_list_id", tierListId);
  const { error } = await supabase.from("tiers").delete().eq("id", tierId);
  if (error) throw error;
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function saveItems(items: TierItem[]): Promise<void> {
  const clean = items.map(({ image: _img, ...rest }: TierItem & { image?: Image }) => rest);
  const { error } = await db()
    .from("tier_items")
    .upsert(clean, { onConflict: "id" });
  if (error) throw error;
}

export async function addItemToPool(tierListId: string, imageId: string, position: number): Promise<TierItem> {
  const { data, error } = await db()
    .from("tier_items")
    .insert({ id: uuidv4(), tier_list_id: tierListId, tier_id: null, image_id: imageId, position })
    .select("*, image:images(*)")
    .single();
  if (error) throw error;
  return data;
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function uploadImage(userId: string, file: File): Promise<Image> {
  const supabase = db();
  const imageId = uuidv4();
  const ext = file.name.split(".").pop();
  const storagePath = `${userId}/${imageId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("images")
    .insert({ id: imageId, user_id: userId, name: file.name, storage_path: storagePath })
    .select().single();
  if (error) throw error;

  return data;
}

export async function getUserImages(userId: string): Promise<Image[]> {
  const { data, error } = await db()
    .from("images")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ─── Tier List Name ───────────────────────────────────────────────────────────

export async function updateTierListName(id: string, name: string): Promise<void> {
  const { error } = await db()
    .from("tier_lists")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
