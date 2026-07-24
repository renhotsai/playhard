interface Announcement {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string | Date;
}

interface AnnouncementListProps {
  announcements: Announcement[];
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  if (announcements.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">目前沒有公告</p>
    );
  }

  return (
    <ul className="space-y-3">
      {announcements.map((a) => (
        <li key={a.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start gap-2">
            {a.pinned && (
              <span className="flex-shrink-0 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium mt-0.5">
                置頂
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900">{a.title}</h4>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{a.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(a.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
