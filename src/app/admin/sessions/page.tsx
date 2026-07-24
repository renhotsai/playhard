import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import SessionToggleOpen from "./SessionToggleOpen";

export default async function AdminSessionsPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "asc" },
    include: { script: { select: { title: true } } },
  });

  return (
    <>
      <AdminHeader title="場次管理" />
      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">共 {sessions.length} 個場次</p>
          <Link
            href="/admin/sessions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + 新增場次
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">尚無場次，請新增第一個場次</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-medium">劇本</th>
                    <th className="px-6 py-3 font-medium">場次時間</th>
                    <th className="px-6 py-3 font-medium">報名人數</th>
                    <th className="px-6 py-3 font-medium">開放狀態</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{session.script.title}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {new Date(session.date).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {session.currentPlayers} / {session.maxPlayers}
                      </td>
                      <td className="px-6 py-4">
                        <SessionToggleOpen id={session.id} open={session.open} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/sessions/${session.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          編輯
                        </Link>
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
