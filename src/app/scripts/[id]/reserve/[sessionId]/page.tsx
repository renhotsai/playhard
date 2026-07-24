"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";

interface Session {
  id: string;
  date: string;
  maxPlayers: number;
  currentPlayers: number;
  open: boolean;
  script: { title: string };
}

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const scriptId = params.id as string;
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    playerCount: "1",
    note: "",
  });

  useEffect(() => {
    fetch(`/api/scripts/${scriptId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.sessions) {
          const s = data.sessions.find((s: Session) => s.id === sessionId);
          setSession(s ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [scriptId, sessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: form.name,
          phone: form.phone,
          email: form.email,
          playerCount: Number(form.playerCount),
          note: form.note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "預約失敗，請稍後再試");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">載入中...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 font-semibold mb-4">找不到此場次或場次已關閉</p>
            <Link href={`/scripts/${scriptId}`} className="text-blue-600 hover:text-blue-800">
              返回劇本頁面
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">預約成功！</h2>
            <p className="text-gray-600 mb-2">
              劇本：<strong>{session.script.title}</strong>
            </p>
            <p className="text-gray-600 mb-6">
              場次：{new Date(session.date).toLocaleString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-gray-500 text-sm mb-6">我們將盡快與您聯繫確認預約詳情。</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                回到首頁
              </Link>
              <Link
                href="/scripts"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                繼續瀏覽劇本
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const spotsLeft = session.maxPlayers - session.currentPlayers;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        <Link href={`/scripts/${scriptId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          ← 返回劇本頁面
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">填寫預約資料</h1>
          <div className="text-sm text-gray-500 mb-6">
            <p>劇本：<strong>{session.script.title}</strong></p>
            <p>
              場次：{new Date(session.date).toLocaleString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>剩餘名額：{spotsLeft} / {session.maxPlayers}</p>
          </div>

          {!session.open && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
              此場次已關閉，無法預約
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入您的姓名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                聯絡電話 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入您的電話號碼"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電子信箱 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入您的電子信箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                報名人數 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={spotsLeft}
                value={form.playerCount}
                onChange={(e) => setForm({ ...form, playerCount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">最多可報名 {spotsLeft} 人</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                備註
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="如有特殊需求請在此說明"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !session.open || spotsLeft <= 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "送出中..." : "確認預約"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
