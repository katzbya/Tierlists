import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTierLists } from "@/lib/database";
import Dashboard from "@/components/dashboard/Dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const lists = await getTierLists(user.id).catch(() => []);

  return <Dashboard initialLists={lists} userId={user.id} />;
}
