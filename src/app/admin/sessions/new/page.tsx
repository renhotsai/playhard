import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import NewSessionForm from "./NewSessionForm";

export default async function NewSessionPage() {
  const scripts = await prisma.script.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <>
      <AdminHeader title="新增場次" />
      <div className="p-6 flex-1 max-w-2xl">
        <Link href="/admin/sessions" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          ← 返回場次管理
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <NewSessionForm scripts={scripts} />
        </div>
      </div>
    </>
  );
}
