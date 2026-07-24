import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ scriptId?: string; date?: string }>;
}) {
  const { scriptId, date } = await searchParams;

  const scripts = await prisma.script.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  const where: Record<string, unknown> = {};

  if (scriptId) {
    where.session = { scriptId };
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      session: {
        include: { script: { select: { id: true, title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter by date if provided
  const filteredReservations = date
    ? reservations.filter((r) => {
        const sessionDate = new Date(r.session.date).toISOString().split("T")[0];
        return sessionDate === date;
      })
    : reservations;

  return (
    <>
      <AdminHeader title="預約管理" />
      <div className="p-6 flex-1">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">依劇本篩選</label>
              <select
                name="scriptId"
                defaultValue={scriptId ?? ""}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">所有劇本</option>
                {scripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">依日期篩選</label>
              <input
                type="date"
                name="date"
                defaultValue={date ?? ""}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              篩選
            </button>
            <a
              href="/admin/reservations"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              清除篩選
            </a>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">共 {filteredReservations.length} 筆預約</p>
          </div>
          {filteredReservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">沒有符合條件的預約記錄</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-medium">姓名</th>
                    <th className="px-6 py-3 font-medium">電話</th>
                    <th className="px-6 py-3 font-medium">信箱</th>
                    <th className="px-6 py-3 font-medium">劇本</th>
                    <th className="px-6 py-3 font-medium">場次時間</th>
                    <th className="px-6 py-3 font-medium">人數</th>
                    <th className="px-6 py-3 font-medium">備註</th>
                    <th className="px-6 py-3 font-medium">預約時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{r.name}</td>
                      <td className="px-6 py-3 text-gray-700">{r.phone}</td>
                      <td className="px-6 py-3 text-gray-700">{r.email}</td>
                      <td className="px-6 py-3 text-gray-700">{r.session.script.title}</td>
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
      </div>
    </>
  );
}
