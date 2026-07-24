"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  active: boolean;
  createdAt: Date | string;
}

interface AnnouncementsClientProps {
  initialAnnouncements: Announcement[];
}

export default function AnnouncementsClient({ initialAnnouncements }: AnnouncementsClientProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", content: "", pinned: false });

  function resetForm() {
    setForm({ title: "", content: "", pinned: false });
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, pinned: a.pinned });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/announcements/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "更新失敗");
        } else {
          setAnnouncements(
            announcements
              .map((a) => (a.id === editingId ? data : a))
              .sort((a, b) => {
                if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
          );
          resetForm();
          router.refresh();
        }
      } else {
        // Create
        const res = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "新增失敗");
        } else {
          setAnnouncements(
            [data, ...announcements].sort((a, b) => {
              if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
          );
          resetForm();
          router.refresh();
        }
      }
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  async function toggleField(id: string, field: "active" | "pinned", currentValue: boolean) {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (res.ok) {
        const updated = announcements
          .map((a) => (a.id === id ? { ...a, [field]: !currentValue } : a))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        setAnnouncements(updated);
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此公告嗎？")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements(announcements.filter((a) => a.id !== id));
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">共 {announcements.length} 個公告</p>
        <button
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showForm && !editingId ? "取消" : "+ 新增公告"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {editingId ? "編輯公告" : "新增公告"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公告標題 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                公告內容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="pinned" className="text-sm font-medium text-gray-700">
                置頂
              </label>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? "儲存中..." : editingId ? "儲存變更" : "新增"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {announcements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">尚無公告</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((a) => (
              <div key={a.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {a.pinned && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">
                          置頂
                        </span>
                      )}
                      {!a.active && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">
                          已隱藏
                        </span>
                      )}
                      <h4 className="font-semibold text-gray-900">{a.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(a.createdAt).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleField(a.id, "pinned", a.pinned)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        a.pinned
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {a.pinned ? "取消置頂" : "置頂"}
                    </button>
                    <button
                      onClick={() => toggleField(a.id, "active", a.active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        a.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {a.active ? "顯示中" : "已隱藏"}
                    </button>
                    <button
                      onClick={() => startEdit(a)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
