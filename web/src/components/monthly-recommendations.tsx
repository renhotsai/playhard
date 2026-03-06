"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import ScriptCard from "@/components/script-card";
import { Script } from "@/data/scripts";

interface MonthlyRecommendationsProps {
  scripts: Script[];
}

export default function MonthlyRecommendations({ scripts }: MonthlyRecommendationsProps) {
  const [isClient, setIsClient] = useState(false);
  const autoScrollRef = useRef<{ stop: () => void; reset: () => void } | null>(null);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: "start",
      containScroll: "trimSnaps"
    },
    isClient && scripts.length > 3 ? [
      AutoScroll({ 
        speed: 1,
        startDelay: 1000,
        stopOnInteraction: false,
        stopOnMouseEnter: true
      })
    ] : []
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Store auto-scroll plugin reference
  useEffect(() => {
    if (isClient && emblaApi && scripts.length > 3) {
      const autoScrollPlugin = emblaApi.plugins().autoScroll;
      if (autoScrollPlugin) {
        autoScrollRef.current = autoScrollPlugin;
      }
    }
  }, [isClient, emblaApi, scripts.length]);

  const onMouseEnter = useCallback(() => {
    if (isClient && autoScrollRef.current && scripts.length > 3) {
      autoScrollRef.current.stop();
    }
  }, [isClient, scripts.length]);

  const onMouseLeave = useCallback(() => {
    if (isClient && autoScrollRef.current && scripts.length > 3) {
      autoScrollRef.current.reset();
    }
  }, [isClient, scripts.length]);

  // 如果劇本數量少於4本，直接顯示grid布局
  if (scripts.length < 4) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
        {scripts.map((script) => (
          <ScriptCard key={script.id} script={script} />
        ))}
      </div>
    );
  }

  // 如果劇本數量大於3本，使用carousel
  return (
    <div className="py-12 overflow-hidden">
      <div
        className="embla overflow-hidden"
        ref={emblaRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="embla__container flex">
          {scripts.map((script) => (
            <div key={script.id} className="embla__slide flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4">
              <ScriptCard script={script} className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}