"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadEditor } from "@/lib/database";
import TierEditor from "@/components/editor/TierEditor";
import type { TierList, TierWithItems, TierItem, Image } from "@/types";

export default function EditorPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    tierList: TierList;
    tiers: TierWithItems[];
    pool: TierItem[];
    images: Record<string, Image>;
    userId: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      try {
        const result = await loadEditor(id);
        if (!result.tierList || result.tierList.user_id !== user.id) {
          router.replace("/dashboard");
          return;
        }
        setData({ ...result, userId: user.id });
      } catch {
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    });
  }, [id]);

  if (loading || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-muted)" }}>Loading tier list…</span>
      </div>
    );
  }

  return (
    <TierEditor
      tierList={data.tierList}
      initialTiers={data.tiers}
      initialPool={data.pool}
      images={data.images}
      userId={data.userId}
    />
  );
}
