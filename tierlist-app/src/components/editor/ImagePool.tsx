"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import type { TierItem, Image } from "@/types";
import DraggableImage from "./DraggableImage";

interface ImagePoolProps {
  items: TierItem[];
  images: Record<string, Image>;
}

export default function ImagePool({ items, images }: ImagePoolProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div>
      <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Image Pool ({items.length})
      </h3>
      <div
        ref={setNodeRef}
        style={{
          minHeight: "100px",
          background: isOver ? "rgba(99,102,241,0.08)" : "var(--surface)",
          border: `2px dashed ${isOver ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "12px",
          padding: "12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignContent: "flex-start",
          transition: "all 0.15s",
        }}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.map((item) => (
            <DraggableImage key={item.id} item={item} image={images[item.image_id]} size={80} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "20px 0" }}>
            Upload images or drag them here from tiers
          </div>
        )}
      </div>
    </div>
  );
}
