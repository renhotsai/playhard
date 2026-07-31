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
          <p className="text-white/50">載入中...</p>
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
          <div className="bg-surface border border-white/10 rounded-lg p-8 text-center">
            <p className="text-red-400 font-semibold mb-4">找不到此場次或場次已關閉</p>
            <Link href={`/scripts/${scriptId}`} className="text-gold hover:text-gold-dark">
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
          <div className="bg-surface border border-white/10 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold font-heading text-gold mb-2">預約成功！</h2>
            <p className="text-white/70 mb-2">
              劇本：<strong className="text-white">{session.script.title}</strong>
            </p>
            <p className="text-white/70 mb-6">
              場次：{new Date(session.date).toLocaleString("zh-TW", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-white/50 text-sm mb-6">我們將盡快與您聯繫確認預約詳情。</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-2 bg-gold text-background rounded-lg hover:bg-gold-dark transition-colors font-medium"
              >
                回到首頁
              </Link>
              <Link
                href="/scripts"
                className="px-6 py-2 border border-white/20 text-white/80 rounded-lg hover:bg-white/5 transition-colors font-medium"
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
        <Link href={`/scripts/${scriptId}`} className="text-gold hover:text-gold-dark text-sm mb-6 inline-block">
          ← 返回劇本頁面
        </Link>

        <div className="bg-surface border border-white/10 rounded-lg p-6">
          <h1 className="text-2xl font-bold font-heading text-white mb-2">填寫預約資料</h1>
          <div className="text-sm text-white/60 mb-6">
            <p>劇本：<strong className="text-white/80">{session.script.title}</strong></p>
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
              此場次已關閉，無法預約
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                姓名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="請輸入您的姓名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                聯絡電話 <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="請輸入您的電話號碼"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                電子信箱 <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="請輸入您的電子信箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                報名人數 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={spotsLeft}
                value={form.playerCount}
                onChange={(e) => setForm({ ...form, playerCount: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
              <p className="text-xs text-white/50 mt-1">最多可報名 {spotsLeft} 人</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                備註
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-white/90 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                rows={3}
                placeholder="如有特殊需求請在此說明"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !session.open || spotsLeft <= 0}
              className="w-full bg-gold text-background py-3 rounded-lg font-semibold hover:bg-gold-dark disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed transition-colors"
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
