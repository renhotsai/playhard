import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditScriptForm from "./EditScriptForm";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";

export default async function EditScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const script = await prisma.script.findUnique({ where: { id } });

  if (!script) {
    notFound();
  }

  return (
    <>
      <AdminHeader title="編輯劇本" />
      <div className="p-6 flex-1 max-w-2xl">
        <Link href="/admin/scripts" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          ← 返回劇本管理
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <EditScriptForm script={script} />
        </div>
      </div>
    </>
  );
}
