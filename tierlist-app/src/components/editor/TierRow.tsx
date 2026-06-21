"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { TierWithItems, Image } from "@/types";
import DraggableImage from "./DraggableImage";

interface TierRowProps {
  tier: TierWithItems;
  images: Record<string, Image>;
  onDeleteTier: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onColorClick: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function TierRow({
  tier, images, onDeleteTier, onUpdateLabel,
  onMoveUp, onMoveDown, onColorClick, isFirst, isLast,
}: TierRowProps) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [label, setLabel] = useState(tier.label);
  const [showActions, setShowActions] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: tier.id });

  function handleLabelBlur() {
    setEditingLabel(false);
    if (label !== tier.label) onUpdateLabel(tier.id, label);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        minHeight: "88px",
        position: "relative",
        background: isOver ? "rgba(99,102,241,0.08)" : "transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Tier label */}
      <div
        style={{
          width: "88px",
          minWidth: "88px",
          background: tier.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "4px",
          cursor: "pointer",
          position: "relative",
        }}
        onClick={onColorClick}
        title="Click to change color"
      >
        {editingLabel ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => e.key === "Enter" && handleLabelBlur()}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "70px", textAlign: "center",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "20px",
              fontWeight: 800,
              border: "none",
              outline: "2px solid white",
              borderRadius: "4px",
              padding: "2px 4px",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "22px", fontWeight: 800, color: "white",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              cursor: "text",
            }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true); }}
            title="Double-click to rename"
          >
            {tier.label}
          </span>
        )}
      </div>

      {/* Items area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: "6px",
          padding: "6px",
          minHeight: "88px",
        }}
      >
        <SortableContext items={tier.items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
          {tier.items.map((item) => (
            <DraggableImage key={item.id} item={item} image={images[item.image_id]} size={76} />
          ))}
        </SortableContext>
        {tier.items.length === 0 && (
          <span style={{ color: "var(--border)", fontSize: "13px", alignSelf: "center", paddingLeft: "4px" }}>
            Drop here
          </span>
        )}
      </div>

      {/* Tier actions */}
      {showActions && (
        <div style={{
          position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: "4px", zIndex: 5,
        }}>
          {!isFirst && (
            <ActionBtn onClick={onMoveUp} title="Move up">↑</ActionBtn>
          )}
          {!isLast && (
            <ActionBtn onClick={onMoveDown} title="Move down">↓</ActionBtn>
          )}
          <ActionBtn onClick={() => onDeleteTier(tier.id)} title="Delete tier" danger>✕</ActionBtn>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ onClick, title, danger, children }: {
  onClick: () => void; title: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: "28px", height: "28px", borderRadius: "6px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: danger ? "#f87171" : "var(--text-muted)",
        cursor: "pointer", fontSize: "14px", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}
