import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import ScriptTogglePublished from "./ScriptTogglePublished";

export default async function AdminScriptsPage() {
  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminHeader title="劇本管理" />
      <div className="p-6 flex-1">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">共 {scripts.length} 個劇本</p>
          <Link
            href="/admin/scripts/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + 新增劇本
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {scripts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">尚無劇本，請新增第一個劇本</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 font-medium">劇本名稱</th>
                    <th className="px-6 py-3 font-medium">類型</th>
                    <th className="px-6 py-3 font-medium">難度</th>
                    <th className="px-6 py-3 font-medium">人數</th>
                    <th className="px-6 py-3 font-medium">上架狀態</th>
                    <th className="px-6 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scripts.map((script) => (
                    <tr key={script.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{script.title}</td>
                      <td className="px-6 py-4 text-gray-700">{script.genre}</td>
                      <td className="px-6 py-4 text-gray-700">{script.difficulty}</td>
                      <td className="px-6 py-4 text-gray-700">{script.playerCount}</td>
                      <td className="px-6 py-4">
                        <ScriptTogglePublished id={script.id} published={script.published} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/scripts/${script.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 font-medium mr-3"
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
