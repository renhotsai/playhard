import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import BannersClient from "./BannersClient";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <AdminHeader title="橫幅管理" />
      <div className="p-6 flex-1">
        <BannersClient initialBanners={banners} />
      </div>
    </>
  );
}
