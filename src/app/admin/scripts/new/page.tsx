"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";

export default function NewScriptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    storyText: "",
    coverImage: "",
    playerCount: "",
    duration: "",
    difficulty: "",
    genre: "",
    pricePerPerson: "",
    priceGroup: "",
    isContactOnly: false,
    bookingNote: "",
    published: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "新增失敗");
      } else {
        router.push("/admin/scripts");
        router.refresh();
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminHeader title="新增劇本" />
      <div className="p-6 flex-1 max-w-2xl">
        <Link href="/admin/scripts" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          ← 返回劇本管理
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                劇本名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                劇本簡介 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                完整故事與角色介紹 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="storyText"
                value={form.storyText}
                onChange={handleChange}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">封面圖片 URL</label>
              <input
                type="text"
                name="coverImage"
                value={form.coverImage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  人數 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="playerCount"
                  value={form.playerCount}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：6-8人"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  時長 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：4-5小時"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">每人價格 (NT$)</label>
                <input
                  type="number"
                  name="pricePerPerson"
                  value={form.pricePerPerson}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：650（與整團價格擇一填寫）"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">整團價格 (NT$)</label>
                <input
                  type="number"
                  name="priceGroup"
                  value={form.priceGroup}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：4200（與每人價格擇一填寫）"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  難度 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="difficulty"
                  value={form.difficulty}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：進階"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  類型 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：推理 / 恐怖"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isContactOnly"
                id="isContactOnly"
                checked={form.isContactOnly}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isContactOnly" className="text-sm font-medium text-gray-700">
                僅接受私訊預約（不使用場次預約系統）
              </label>
            </div>

            {form.isContactOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">預約說明</label>
                <textarea
                  name="bookingNote"
                  value={form.bookingNote}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="例：預約請直接聯繫客服：IG @larpplayhardtw 或官方 LINE"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="published"
                id="published"
                checked={form.published}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">
                立即上架
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "儲存中..." : "儲存劇本"}
              </button>
              <Link
                href="/admin/scripts"
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
