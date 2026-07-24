import prisma from "@/lib/prisma";
import AdminHeader from "@/components/admin/AdminHeader";
import AnnouncementsClient from "./AnnouncementsClient";

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <AdminHeader title="公告管理" />
      <div className="p-6 flex-1">
        <AnnouncementsClient initialAnnouncements={announcements} />
      </div>
    </>
  );
}
