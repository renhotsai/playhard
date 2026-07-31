"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <div className="bg-background h-72 md:h-96 flex flex-col items-center justify-center gap-2 border-b border-white/10">
        <p className="font-heading text-3xl text-gold tracking-wide">PLAY HARD</p>
        <p className="text-white/70 text-lg">玩硬劇本遊戲館</p>
        <p className="text-white/40 text-xs tracking-[0.3em] uppercase">Live Action Role Playing</p>
      </div>
    );
  }

  const banner = banners[current];

  return (
    <div className="relative w-full h-72 md:h-96 overflow-hidden bg-gray-900">
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          {b.linkUrl ? (
            <Link href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <Image
                src={b.imageUrl}
                alt={`橫幅 ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
              />
            </Link>
          ) : (
            <Image
              src={b.imageUrl}
              alt={`橫幅 ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
            />
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            aria-label="上一張"
          >
            &#8249;
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            aria-label="下一張"
          >
            &#8250;
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
                aria-label={`前往第 ${i + 1} 張`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
