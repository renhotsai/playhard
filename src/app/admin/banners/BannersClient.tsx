"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
}

interface BannersClientProps {
  initialBanners: Banner[];
}

export default function BannersClient({ initialBanners }: BannersClientProps) {
  const router = useRouter();
  const [banners, setBanners] = useState(initialBanners);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ imageUrl: "", linkUrl: "", sortOrder: "0" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: form.imageUrl,
          linkUrl: form.linkUrl,
          sortOrder: Number(form.sortOrder),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "新增失敗");
      } else {
        setBanners([...banners, data].sort((a, b) => a.sortOrder - b.sortOrder));
        setForm({ imageUrl: "", linkUrl: "", sortOrder: "0" });
        setShowForm(false);
        router.refresh();
      }
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) {
        setBanners(banners.map((b) => (b.id === id ? { ...b, active: !active } : b)));
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此橫幅嗎？")) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  async function updateSortOrder(id: string, sortOrder: number) {
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      });
      if (res.ok) {
        setBanners(
          banners
            .map((b) => (b.id === id ? { ...b, sortOrder } : b))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        );
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500 text-sm">共 {banners.length} 個橫幅</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showForm ? "取消" : "+ 新增橫幅"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">新增橫幅</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                圖片 URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">點擊連結</label>
              <input
                type="text"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? "新增中..." : "新增"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">尚無橫幅</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 font-medium">圖片 URL</th>
                  <th className="px-6 py-3 font-medium">連結</th>
                  <th className="px-6 py-3 font-medium">排序</th>
                  <th className="px-6 py-3 font-medium">狀態</th>
                  <th className="px-6 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 max-w-xs truncate text-gray-700">{banner.imageUrl}</td>
                    <td className="px-6 py-3 max-w-xs truncate text-gray-500">{banner.linkUrl || "-"}</td>
                    <td className="px-6 py-3">
                      <input
                        type="number"
                        defaultValue={banner.sortOrder}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (val !== banner.sortOrder) {
                            updateSortOrder(banner.id, val);
                          }
                        }}
                        className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggleActive(banner.id, banner.active)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          banner.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {banner.active ? "顯示中" : "已隱藏"}
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
