import Link from "next/link";
import Image from "next/image";

interface ScriptCardProps {
  id: string;
  title: string;
  coverImage: string;
  playerCount: string;
  genre: string;
  difficulty: string;
  duration: string;
}

export default function ScriptCard({
  id,
  title,
  coverImage,
  playerCount,
  genre,
  difficulty,
  duration,
}: ScriptCardProps) {
  return (
    <Link href={`/scripts/${id}`} className="block group">
      <div className="rounded-lg shadow bg-white overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-48 bg-gray-200">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-4xl">🎭</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{title}</h3>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{genre}</span>
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{difficulty}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-gray-500">
            <span>👥 {playerCount}</span>
            <span>⏱ {duration}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
