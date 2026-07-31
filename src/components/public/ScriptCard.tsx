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
  pricePerPerson: number | null;
  priceGroup: number | null;
  isContactOnly: boolean;
}

export default function ScriptCard({
  id,
  title,
  coverImage,
  playerCount,
  genre,
  difficulty,
  duration,
  pricePerPerson,
  priceGroup,
  isContactOnly,
}: ScriptCardProps) {
  const priceLabel =
    pricePerPerson != null ? `NT$${pricePerPerson}/人` : priceGroup != null ? `NT$${priceGroup}/團` : null;

  return (
    <Link href={`/scripts/${id}`} className="block group">
      <div className="rounded-lg bg-surface border border-white/10 overflow-hidden hover:border-gold transition-colors">
        <div className="relative h-48 bg-black/40">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/30">
              <span className="text-4xl">🎭</span>
            </div>
          )}
          {isContactOnly && (
            <span className="absolute top-2 right-2 bg-gold text-background text-xs font-semibold px-2 py-1 rounded">
              洽詢預約
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold font-heading text-lg text-white mb-2 line-clamp-1">{title}</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="bg-gold/15 text-gold px-2 py-0.5 rounded">{genre}</span>
            <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded">{difficulty}</span>
          </div>
          <div className="mt-3 flex justify-between items-center text-sm text-white/60">
            <span>
              👥 {playerCount} ・ ⏱ {duration}
            </span>
            {priceLabel && <span className="text-gold font-semibold">{priceLabel}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
