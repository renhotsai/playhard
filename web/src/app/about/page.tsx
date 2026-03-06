"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import HostCard from "@/components/host-card";
import VenueCard from "@/components/venue-card";
import SiteFooter from "@/components/site-footer";
import { useVenues } from "@/hooks/use-venues";

const hosts = [
  {
    name: "李主持",
    avatar: "/avatars/host-1.jpg",
    instagramHandle: "mystery_host_lee"
  },
  {
    name: "王DM",
    avatar: "/avatars/host-2.jpg",
    instagramHandle: "wuxia_master_wang"
  },
  {
    name: "張策劃",
    avatar: "/avatars/host-3.jpg",
    instagramHandle: "script_master_zhang"
  }
];

export default function AboutPage() {
  const { data: venues, isLoading } = useVenues();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background text-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">關於玩硬劇本館</h1>
          <p className="text-xl max-w-3xl mx-auto text-muted-foreground">
            我們致力於提供最優質的劇本殺體驗，用心打造每一個細節，讓您在推理的世界中盡情探索
          </p>
        </div>
      </section>

      {/* Hosts Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">專業主持人</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {hosts.map((host, index) => (
              <HostCard key={index} {...host} />
            ))}
          </div>
        </div>
      </section>

      {/* Venues Section */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-accent-foreground">場館資訊</h2>
          {isLoading ? (
            <div className="text-center text-muted-foreground">載入中...</div>
          ) : (
            <div className="grid lg:grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
              {venues?.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  showMap={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}