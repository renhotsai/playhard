import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// Matches http(s) URLs embedded in free-form Chinese text. Stops at whitespace
// and at punctuation (full/half-width) that commonly follows a URL in the
// seeded booking notes (e.g. a closing full-width parenthesis or period), so
// trailing punctuation is never swallowed into the link.
const URL_PATTERN = /https?:\/\/[^\s）」，。、]+/g;

function renderBookingNote(note: string): ReactNode[] {
  const parts = note.split(URL_PATTERN);
  const urls = note.match(URL_PATTERN) ?? [];

  const nodes: ReactNode[] = [];
  parts.forEach((text, i) => {
    if (text) {
      nodes.push(<span key={`t${i}`}>{text}</span>);
    }
    const url = urls[i];
    if (url) {
      nodes.push(
        <a
          key={`u${i}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:text-gold-dark underline"
        >
          {url}
        </a>,
      );
    }
  });
  return nodes;
}

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();

  const script = await prisma.script.findUnique({
    where: { id, published: true },
    include: {
      sessions: {
        where: { open: true, date: { gte: now } },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!script) {
    notFound();
  }

  const priceLabel =
    script.pricePerPerson != null
      ? `NT$${script.pricePerPerson} / 人`
      : script.priceGroup != null
        ? `NT$${script.priceGroup} / 團`
        : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <Link href="/scripts" className="text-gold hover:text-gold-dark text-sm mb-6 inline-block">
          ← 返回劇本列表
        </Link>

        <div className="bg-surface border border-white/10 rounded-lg overflow-hidden">
          {script.coverImage && (
            <div className="relative h-72 bg-black/40">
              <Image src={script.coverImage} alt={script.title} fill className="object-cover" />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold font-heading text-white mb-4">{script.title}</h1>

            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <span className="bg-gold/15 text-gold px-3 py-1 rounded-full text-sm font-medium">{script.genre}</span>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">{script.difficulty}</span>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">👥 {script.playerCount}</span>
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">⏱ {script.duration}</span>
              {priceLabel && (
                <span className="text-gold font-semibold text-lg ml-auto">{priceLabel}</span>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold font-heading text-white mb-3">劇本簡介</h2>
              <p className="text-white/70 leading-relaxed whitespace-pre-line">{script.storyText}</p>
            </div>

            {script.isContactOnly ? (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold font-heading text-gold mb-3">如何預約</h2>
                <p className="text-white/80 whitespace-pre-line">
                  {script.bookingNote ? renderBookingNote(script.bookingNote) : null}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold font-heading text-white mb-4">可預約場次</h2>
                {script.sessions.length === 0 ? (
                  <div className="bg-black/20 rounded-lg p-6 text-center text-white/50">
                    目前沒有開放中的場次，請關注最新公告
                  </div>
                ) : (
                  <div className="space-y-3">
                    {script.sessions.map((session) => {
                      const spotsLeft = session.maxPlayers - session.currentPlayers;
                      return (
                        <div
                          key={session.id}
                          className="border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              {new Date(session.date).toLocaleString("zh-TW", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-sm text-white/50 mt-1">
                              剩餘名額：{spotsLeft} / {session.maxPlayers}
                            </p>
                          </div>
                          <Link
                            href={`/scripts/${id}/reserve/${session.id}`}
                            className={`inline-block text-center px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                              spotsLeft > 0
                                ? "bg-gold text-background hover:bg-gold-dark"
                                : "bg-white/10 text-white/40 cursor-not-allowed pointer-events-none"
                            }`}
                          >
                            {spotsLeft > 0 ? "我要預約" : "名額已滿"}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
