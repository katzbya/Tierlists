"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TierItem, Image } from "@/types";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

function getImageUrl(storagePath: string) {
  return supabase.storage.from("images").getPublicUrl(storagePath).data.publicUrl;
}

interface DraggableImageProps {
  item: TierItem;
  image?: Image;
  isDragging?: boolean;
  size?: number;
}

export default function DraggableImage({ item, image, isDragging = false, size = 80 }: DraggableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    touchAction: "none",
  };

  if (!image) return null;

  const url = getImageUrl(image.storage_path);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <img
        src={url}
        alt={image.name}
        width={size}
        height={size}
        style={{
          width: size, height: size, objectFit: "cover",
          borderRadius: "4px",
          border: isDragging ? "2px solid var(--accent)" : "2px solid transparent",
          display: "block",
          userSelect: "none",
          WebkitUserDrag: "none",
        } as React.CSSProperties}
        draggable={false}
      />
    </div>
  );
}
