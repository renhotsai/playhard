"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Script {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  playerCount: string;
  duration: string;
  difficulty: string;
  genre: string;
  published: boolean;
}

export default function EditScriptForm({ script }: { script: Script }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: script.title,
    description: script.description,
    coverImage: script.coverImage,
    playerCount: script.playerCount,
    duration: script.duration,
    difficulty: script.difficulty,
    genre: script.genre,
    published: script.published,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "更新失敗");
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

  async function handleDelete() {
    if (!confirm(`確定要刪除劇本「${script.title}」嗎？此操作無法復原，並將刪除所有相關場次與預約。`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/scripts");
        router.refresh();
      } else {
        setError("刪除失敗");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
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
        <label className="block text-sm font-medium text-gray-700 mb-1">封面圖片 URL</label>
        <input
          type="text"
          name="coverImage"
          value={form.coverImage}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            required
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
            required
          />
        </div>
      </div>

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
          上架
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "儲存中..." : "儲存變更"}
          </button>
          <Link
            href="/admin/scripts"
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </Link>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
        >
          {deleting ? "刪除中..." : "刪除劇本"}
        </button>
      </div>
    </form>
  );
}
