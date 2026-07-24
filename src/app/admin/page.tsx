import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const now = new Date();

  const [scriptCount, upcomingSessionCount, recentReservations] = await Promise.all([
    prisma.script.count(),
    prisma.session.count({
      where: { date: { gte: now }, open: true },
    }),
    prisma.reservation.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        session: {
          include: { script: { select: { title: true } } },
        },
      },
    }),
  ]);

  return (
    <>
      <AdminHeader title="儀表板" />
      <div className="p-6 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">劇本總數</p>
            <p className="text-4xl font-bold text-gray-900">{scriptCount}</p>
            <Link href="/admin/scripts" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              管理劇本 →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">即將開始的場次</p>
            <p className="text-4xl font-bold text-gray-900">{upcomingSessionCount}</p>
            <Link href="/admin/sessions" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              管理場次 →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">最近預約筆數</p>
            <p className="text-4xl font-bold text-gray-900">{recentReservations.length}</p>
            <Link href="/admin/reservations" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
              查看預約 →
            </Link>
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">最近預約</h2>
          </div>
          {recentReservations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">尚無預約記錄</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">姓名</th>
                    <th className="px-6 py-3 font-medium">劇本</th>
                    <th className="px-6 py-3 font-medium">場次時間</th>
                    <th className="px-6 py-3 font-medium">人數</th>
                    <th className="px-6 py-3 font-medium">預約時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-6 py-3 text-gray-700">{r.session.script.title}</td>
                      <td className="px-6 py-3 text-gray-700">
                        {new Date(r.session.date).toLocaleString("zh-TW", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{r.playerCount} 人</td>
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
      </div>
    </>
  );
}
