"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  DragOverlay, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toPng } from "html-to-image";
import { uploadImage, addItemToPool, saveTiers, saveItems, addTier, deleteTier, updateTierListName } from "@/lib/database";
import type { TierList, TierWithItems, TierItem, Image } from "@/types";
import { TIER_COLORS } from "@/types";
import TierRow from "./TierRow";
import ImagePool from "./ImagePool";
import DraggableImage from "./DraggableImage";

interface TierEditorProps {
  tierList: TierList;
  initialTiers: TierWithItems[];
  initialPool: TierItem[];
  images: Record<string, Image>;
  userId: string;
}

export default function TierEditor({ tierList, initialTiers, initialPool, images: initialImages, userId }: TierEditorProps) {
  const [listName, setListName] = useState(tierList.name);
  const [editingName, setEditingName] = useState(false);
  const [tiers, setTiers] = useState<TierWithItems[]>(initialTiers);
  const [pool, setPool] = useState<TierItem[]>(initialPool);
  const [images, setImages] = useState<Record<string, Image>>(initialImages);
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [colorPickerTierId, setColorPickerTierId] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // ─── Save helpers ─────────────────────────────────────────────────────────

  const save = useCallback(async (newTiers: TierWithItems[], newPool: TierItem[]) => {
    setSaving(true);
    try {
      const allItems = [...newPool, ...newTiers.flatMap((t) => t.items)];
      await Promise.all([
        saveTiers(newTiers.map(({ items: _items, ...t }) => t)),
        saveItems(allItems),
      ]);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── Image upload ─────────────────────────────────────────────────────────

  async function handleUpload(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const img = await uploadImage(userId, file);
        const item = await addItemToPool(tierList.id, img.id, pool.length);
        setImages((prev) => ({ ...prev, [img.id]: img }));
        setPool((prev) => [...prev, { ...item, image: img }]);
      }
    } finally {
      setUploading(false);
    }
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  function findItemLocation(itemId: string): { tierId: string | null; index: number } {
    for (const tier of tiers) {
      const idx = tier.items.findIndex((i) => i.id === itemId);
      if (idx !== -1) return { tierId: tier.id, index: idx };
    }
    const idx = pool.findIndex((i) => i.id === itemId);
    if (idx !== -1) return { tierId: null, index: idx };
    return { tierId: null, index: -1 };
  }

  function onDragStart({ active }: DragStartEvent) {
    const loc = findItemLocation(active.id as string);
    if (loc.tierId) {
      const tier = tiers.find((t) => t.id === loc.tierId)!;
      setActiveItem(tier.items[loc.index]);
    } else if (loc.index !== -1) {
      setActiveItem(pool[loc.index]);
    }
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLoc = findItemLocation(activeId);
    if (activeLoc.tierId === overId || (activeLoc.tierId === null && overId === "pool")) return;

    const overIsTier = tiers.some((t) => t.id === overId);
    const overIsPool = overId === "pool";
    const overItem = [...tiers.flatMap((t) => t.items), ...pool].find((i) => i.id === overId);

    if (!overIsTier && !overIsPool && !overItem) return;

    setTiers((prevTiers) => {
      const newTiers = prevTiers.map((t) => ({ ...t, items: [...t.items] }));
      let newPool = [...pool];

      // Remove from source
      let movedItem: TierItem;
      if (activeLoc.tierId) {
        const srcTier = newTiers.find((t) => t.id === activeLoc.tierId)!;
        [movedItem] = srcTier.items.splice(activeLoc.index, 1);
      } else {
        [movedItem] = newPool.splice(activeLoc.index, 1);
      }

      // Add to target
      const targetTierId = overIsTier ? overId : overIsPool ? null : (
        tiers.find((t) => t.items.some((i) => i.id === overId))?.id ?? null
      );

      if (targetTierId) {
        const dstTier = newTiers.find((t) => t.id === targetTierId)!;
        const overItemIdx = dstTier.items.findIndex((i) => i.id === overId);
        if (overItemIdx !== -1) {
          dstTier.items.splice(overItemIdx, 0, { ...movedItem, tier_id: targetTierId });
        } else {
          dstTier.items.push({ ...movedItem, tier_id: targetTierId });
        }
      } else {
        const overItemIdx = newPool.findIndex((i) => i.id === overId);
        if (overItemIdx !== -1) {
          newPool.splice(overItemIdx, 0, { ...movedItem, tier_id: null });
        } else {
          newPool.push({ ...movedItem, tier_id: null });
        }
      }

      setPool(newPool);
      return newTiers;
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) {
      save(tiers, pool);
      return;
    }

    // Handle reordering within same container
    setTiers((prevTiers) => {
      const newTiers = prevTiers.map((t) => ({ ...t, items: [...t.items] }));
      let newPool = [...pool];

      for (const tier of newTiers) {
        const oldIdx = tier.items.findIndex((i) => i.id === activeId);
        const newIdx = tier.items.findIndex((i) => i.id === overId);
        if (oldIdx !== -1 && newIdx !== -1) {
          tier.items = arrayMove(tier.items, oldIdx, newIdx)
            .map((item, idx) => ({ ...item, position: idx }));
          save(newTiers, newPool);
          setPool(newPool);
          return newTiers;
        }
      }

      const oldIdx = newPool.findIndex((i) => i.id === activeId);
      const newIdx = newPool.findIndex((i) => i.id === overId);
      if (oldIdx !== -1 && newIdx !== -1) {
        newPool = arrayMove(newPool, oldIdx, newIdx)
          .map((item, idx) => ({ ...item, position: idx }));
        setPool(newPool);
        save(newTiers, newPool);
      }

      return newTiers;
    });
  }

  // ─── Tier management ─────────────────────────────────────────────────────

  async function handleAddTier() {
    const tier = await addTier(tierList.id, tiers.length);
    setTiers((prev) => [...prev, { ...tier, items: [] }]);
  }

  async function handleDeleteTier(tierId: string) {
    await deleteTier(tierId, tierList.id);
    const removedTier = tiers.find((t) => t.id === tierId)!;
    const returnedItems = removedTier.items.map((item) => ({ ...item, tier_id: null }));
    setPool((prev) => [...prev, ...returnedItems]);
    setTiers((prev) => prev.filter((t) => t.id !== tierId));
  }

  function handleUpdateTierLabel(tierId: string, label: string) {
    setTiers((prev) => prev.map((t) => t.id === tierId ? { ...t, label } : t));
  }

  function handleUpdateTierColor(tierId: string, color: string) {
    setTiers((prev) => prev.map((t) => t.id === tierId ? { ...t, color } : t));
    setColorPickerTierId(null);
    save(tiers.map((t) => t.id === tierId ? { ...t, color } : t), pool);
  }

  function handleMoveTier(tierId: string, direction: "up" | "down") {
    setTiers((prev) => {
      const idx = prev.findIndex((t) => t.id === tierId);
      if ((direction === "up" && idx === 0) || (direction === "down" && idx === prev.length - 1)) return prev;
      const newTiers = arrayMove(prev, idx, direction === "up" ? idx - 1 : idx + 1)
        .map((t, i) => ({ ...t, position: i }));
      save(newTiers, pool);
      return newTiers;
    });
  }

  // ─── Name editing ─────────────────────────────────────────────────────────

  async function handleNameBlur() {
    setEditingName(false);
    if (listName !== tierList.name) {
      await updateTierListName(tierList.id, listName);
    }
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  async function handleExport() {
    if (!exportRef.current) return;
    const png = await toPng(exportRef.current, { cacheBust: true, backgroundColor: "#1a1a24" });
    const a = document.createElement("a");
    a.href = png;
    a.download = `${listName}.png`;
    a.click();
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const allItems = [...tiers.flatMap((t) => t.items), ...pool];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <a href="/dashboard" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 700, fontSize: "18px", flexShrink: 0 }}>
            TierForge
          </a>
          <span style={{ color: "var(--border)" }}>›</span>
          {editingName ? (
            <input
              autoFocus
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => e.key === "Enter" && handleNameBlur()}
              style={{ fontSize: "15px", fontWeight: 600, padding: "4px 8px", minWidth: 0, flex: 1, maxWidth: "300px" }}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              style={{
                background: "none", border: "none", color: "var(--text)",
                fontSize: "15px", fontWeight: 600, cursor: "pointer",
                padding: "4px 8px", borderRadius: "6px", maxWidth: "300px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
              title="Click to rename"
            >
              {listName}
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {saving && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Saving…</span>}
          <label style={{
            background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "8px 14px", fontSize: "13px", cursor: "pointer",
          }}>
            {uploading ? "Uploading…" : "Upload Images"}
            <input
              type="file" accept="image/*" multiple hidden
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </label>
          <button
            onClick={handleExport}
            style={{
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 14px", fontSize: "13px",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            Export PNG
          </button>
        </div>
      </header>

      {/* Editor */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div style={{ flex: 1, padding: "20px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          {/* Exportable area */}
          <div ref={exportRef} style={{ background: "var(--surface)", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
            {tiers.map((tier) => (
              <TierRow
                key={tier.id}
                tier={tier}
                images={images}
                onDeleteTier={handleDeleteTier}
                onUpdateLabel={handleUpdateTierLabel}
                onMoveUp={() => handleMoveTier(tier.id, "up")}
                onMoveDown={() => handleMoveTier(tier.id, "down")}
                onColorClick={() => setColorPickerTierId(tier.id)}
                isFirst={tiers[0]?.id === tier.id}
                isLast={tiers[tiers.length - 1]?.id === tier.id}
              />
            ))}
          </div>

          {/* Add tier button */}
          <button
            onClick={handleAddTier}
            style={{
              width: "100%", background: "var(--surface-2)", border: "1px dashed var(--border)",
              color: "var(--text-muted)", borderRadius: "8px", padding: "10px",
              cursor: "pointer", fontSize: "13px", marginBottom: "24px",
            }}
          >
            + Add Tier
          </button>

          {/* Image Pool */}
          <ImagePool items={pool} images={images} />
        </div>

        <DragOverlay>
          {activeItem && (
            <DraggableImage
              item={activeItem}
              image={images[activeItem.image_id]}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Color picker modal */}
      {colorPickerTierId && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}
          onClick={() => setColorPickerTierId(null)}
        >
          <div
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Choose color</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 36px)", gap: "8px" }}>
              {TIER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleUpdateTierColor(colorPickerTierId, color)}
                  style={{
                    width: "36px", height: "36px", borderRadius: "6px",
                    background: color, border: "none", cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
