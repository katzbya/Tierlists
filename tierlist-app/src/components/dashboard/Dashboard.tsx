"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTierList, deleteTierList, duplicateTierList } from "@/lib/database";
import type { TierList } from "@/types";

interface DashboardProps {
  initialLists: TierList[];
  userId: string;
}

export default function Dashboard({ initialLists, userId }: DashboardProps) {
  const [lists, setLists] = useState(initialLists);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const list = await createTierList(userId, newName.trim());
      setLists((prev) => [list, ...prev]);
      setShowCreateModal(false);
      setNewName("");
      router.push(`/editor/${list.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this tier list?")) return;
    await deleteTierList(id);
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleDuplicate(id: string) {
    const copy = await duplicateTierList(id, userId);
    setLists((prev) => [copy, ...prev]);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent)" }}>TierForge</span>
        <button
          onClick={handleSignOut}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>My Tier Lists</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{lists.length} list{lists.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            + New Tier List
          </button>
        </div>

        {lists.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 24px",
            color: "var(--text-muted)",
            border: "2px dashed var(--border)",
            borderRadius: "16px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏆</div>
            <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>No tier lists yet</p>
            <p style={{ fontSize: "14px" }}>Create your first tier list to get started</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}>
            {lists.map((list) => (
              <TierListCard
                key={list.id}
                list={list}
                onOpen={() => router.push(`/editor/${list.id}`)}
                onDuplicate={() => handleDuplicate(list.id)}
                onDelete={() => handleDelete(list.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "32px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>New Tier List</h2>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Best Movies of 2024"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              style={{ width: "100%", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1, background: "var(--surface-2)", color: "var(--text)",
                  border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                style={{
                  flex: 1, background: "var(--accent)", color: "white",
                  border: "none", borderRadius: "8px", padding: "10px",
                  fontWeight: 600, cursor: "pointer", opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TierListCard({
  list, onOpen, onDuplicate, onDelete, formatDate,
}: {
  list: TierList;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "20px",
        cursor: "pointer",
        transition: "border-color 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }} onClick={onOpen}>
          <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>{list.name}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Updated {formatDate(list.updated_at)}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              cursor: "pointer", padding: "4px 8px", borderRadius: "6px", fontSize: "18px",
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute", right: 0, top: "100%", marginTop: "4px",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: "10px", overflow: "hidden", zIndex: 10, minWidth: "140px",
              }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              {[
                { label: "Open", action: onOpen },
                { label: "Duplicate", action: onDuplicate },
                { label: "Delete", action: onDelete, danger: true },
              ].map(({ label, action, danger }) => (
                <button
                  key={label}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); action(); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "10px 16px", border: "none", cursor: "pointer",
                    background: "none", color: danger ? "#f87171" : "var(--text)",
                    fontSize: "14px",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
