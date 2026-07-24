import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import LogoutButton from "./LogoutButton";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: session.user.id },
    include: {
      session: {
        include: { script: { select: { title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">會員中心</h1>
            <p className="text-gray-500 text-sm mt-1">
              {session.user.name}（{session.user.email}）
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">共 {reservations.length} 筆預約紀錄</p>
          </div>
          {reservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">尚無預約紀錄</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-medium">劇本</th>
                    <th className="px-6 py-3 font-medium">場次時間</th>
                    <th className="px-6 py-3 font-medium">人數</th>
                    <th className="px-6 py-3 font-medium">備註</th>
                    <th className="px-6 py-3 font-medium">預約時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {r.session.script.title}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {new Date(r.session.date).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{r.playerCount} 人</td>
                      <td className="px-6 py-3 text-gray-500">{r.note || "-"}</td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString("zh-TW")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
