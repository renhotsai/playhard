"use client";

import { useMemo, useState } from "react";
import ScriptCard from "./ScriptCard";

const GENRES = ["全部", "恐怖", "歡樂", "情感", "推理", "新手推薦", "神秘私團"];

interface Script {
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

export default function ScriptsGrid({ scripts }: { scripts: Script[] }) {
  const [activeGenre, setActiveGenre] = useState("全部");

  const filtered = useMemo(
    () => (activeGenre === "全部" ? scripts : scripts.filter((s) => s.genre === activeGenre)),
    [scripts, activeGenre]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeGenre === g
                ? "bg-gold text-background border-gold"
                : "border-white/20 text-white/70 hover:border-gold hover:text-gold"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-white/10 rounded-lg p-12 text-center text-white/50">
          此分類目前尚無劇本
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((script) => (
            <ScriptCard key={script.id} {...script} />
          ))}
        </div>
      )}
    </div>
  );
}
