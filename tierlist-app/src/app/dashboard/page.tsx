"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getTierLists } from "@/lib/database";
import Dashboard from "@/components/dashboard/Dashboard";
import type { TierList } from "@/types";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [lists, setLists] = useState<TierList[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      getTierLists(user.id)
        .then(setLists)
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading || !userId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-muted)" }}>Loading…</span>
      </div>
    );
  }

  return <Dashboard initialLists={lists} userId={userId} />;
}
