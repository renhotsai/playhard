import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Link from "next/link";
import EditSessionForm from "./EditSessionForm";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, scripts] = await Promise.all([
    prisma.session.findUnique({
      where: { id },
      include: { script: { select: { title: true } } },
    }),
    prisma.script.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <>
      <AdminHeader title="編輯場次" />
      <div className="p-6 flex-1 max-w-2xl">
        <Link href="/admin/sessions" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">
          ← 返回場次管理
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <EditSessionForm session={session} scripts={scripts} />
        </div>
      </div>
    </>
  );
}
