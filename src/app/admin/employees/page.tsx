import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import AdminHeader from "@/components/admin/AdminHeader";
import CreateEmployeeForm from "./CreateEmployeeForm";

export default async function AdminEmployeesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "owner") {
    redirect("/admin");
  }

  const employees = await prisma.user.findMany({
    where: { role: { in: ["owner", "employee"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <>
      <AdminHeader title="員工管理" />
      <div className="p-6 flex-1 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">新增員工</h2>
          <CreateEmployeeForm />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">共 {employees.length} 位帳號</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 font-medium">姓名</th>
                  <th className="px-6 py-3 font-medium">電子信箱</th>
                  <th className="px-6 py-3 font-medium">角色</th>
                  <th className="px-6 py-3 font-medium">建立時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{e.name}</td>
                    <td className="px-6 py-3 text-gray-700">{e.email}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {e.role === "owner" ? "老闆" : "員工"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(e.createdAt).toLocaleDateString("zh-TW")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
