import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadEditor } from "@/lib/database";
import TierEditor from "@/components/editor/TierEditor";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    const { tierList, tiers, pool, images } = await loadEditor(id);
    if (!tierList || tierList.user_id !== user.id) notFound();

    return (
      <TierEditor
        tierList={tierList}
        initialTiers={tiers}
        initialPool={pool}
        images={images}
        userId={user.id}
      />
    );
  } catch {
    notFound();
  }
}
