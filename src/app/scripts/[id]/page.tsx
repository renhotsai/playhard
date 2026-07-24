import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <Link href="/scripts" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          ← 返回劇本列表
        </Link>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Cover Image */}
          {script.coverImage && (
            <div className="relative h-72 bg-gray-200">
              <Image
                src={script.coverImage}
                alt={script.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{script.title}</h1>

            {/* Meta info */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {script.genre}
              </span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {script.difficulty}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                👥 {script.playerCount}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                ⏱ {script.duration}
              </span>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">劇本簡介</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{script.description}</p>
            </div>

            {/* Sessions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">可預約場次</h2>
              {script.sessions.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                  目前沒有開放中的場次，請關注最新公告
                </div>
              ) : (
                <div className="space-y-3">
                  {script.sessions.map((session) => {
                    const spotsLeft = session.maxPlayers - session.currentPlayers;
                    return (
                      <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(session.date).toLocaleString("zh-TW", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              weekday: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            剩餘名額：{spotsLeft} / {session.maxPlayers}
                          </p>
                        </div>
                        <Link
                          href={`/scripts/${id}/reserve/${session.id}`}
                          className={`inline-block text-center px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
                            spotsLeft > 0
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none"
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
