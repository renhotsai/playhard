import prisma from "@/lib/prisma";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import BannerCarousel from "@/components/public/BannerCarousel";
import AnnouncementList from "@/components/public/AnnouncementList";
import ScriptCard from "@/components/public/ScriptCard";
import Link from "next/link";

export default async function HomePage() {
  const [banners, announcements, featuredScripts] = await Promise.all([
    prisma.banner.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.announcement.findMany({
      where: { active: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.script.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <BannerCarousel banners={banners} />

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Featured Scripts */}
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">精選劇本</h2>
                <Link href="/scripts" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  查看全部 →
                </Link>
              </div>
              {featuredScripts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  目前尚無上架劇本
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {featuredScripts.map((script) => (
                    <ScriptCard key={script.id} {...script} />
                  ))}
                </div>
              )}
            </section>

            {/* Announcements */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">最新公告</h2>
              <AnnouncementList announcements={announcements} />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
