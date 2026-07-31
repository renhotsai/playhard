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
    return <p className="text-white/50 text-center py-4">目前沒有公告</p>;
  }

  return (
    <ul className="space-y-3">
      {announcements.map((a) => (
        <li key={a.id} className="bg-surface border border-white/10 rounded-lg p-4">
          <div className="flex items-start gap-2">
            {a.pinned && (
              <span className="flex-shrink-0 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded font-medium mt-0.5">
                置頂
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white">{a.title}</h4>
              <p className="text-sm text-white/60 mt-1 whitespace-pre-line">{a.content}</p>
              <p className="text-xs text-white/30 mt-2">
                {new Date(a.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
