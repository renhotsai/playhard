"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Building } from "lucide-react";
import { Venue } from "@/data/venues";

interface VenueCardProps {
  venue: Venue;
  showMap?: boolean;
}

export default function VenueCard({ venue, showMap = true }: VenueCardProps) {
  const getStatusBadge = () => {
    switch (venue.status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">營業中</Badge>;
      case "coming_soon":
        return <Badge variant="secondary">即將開幕</Badge>;
      case "temporarily_closed":
        return <Badge variant="destructive">暫時休館</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {venue.isMainBranch && <Building className="w-5 h-5 text-primary" />}
            {venue.name}
          </CardTitle>
          {getStatusBadge()}
        </div>
        {venue.description && (
          <p className="text-sm text-muted-foreground">{venue.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 營業時間 */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            營業時間
          </h4>
          <div className="text-sm space-y-1 pl-6">
            <div className="flex justify-between">
              <span>週一至週五</span>
              <span className="text-muted-foreground">{venue.hours.weekdays}</span>
            </div>
            <div className="flex justify-between">
              <span>週六至週日</span>
              <span className="text-muted-foreground">{venue.hours.weekends}</span>
            </div>
            <div className="flex justify-between">
              <span>國定假日</span>
              <span className="text-muted-foreground">{venue.hours.holidays}</span>
            </div>
          </div>
        </div>

        {/* 聯絡資訊 */}
        <div className="space-y-2">
          <h4 className="font-medium">聯絡資訊</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div>{venue.contact.address}</div>
                <div className="text-muted-foreground">{venue.contact.transportation}</div>
              </div>
            </div>
          </div>
        </div>


        {/* 地圖 */}
        {showMap && venue.contact.googleMapsEmbedUrl && (
          <div className="space-y-2">
            <h4 className="font-medium">位置地圖</h4>
            <div className="aspect-video w-full rounded-lg overflow-hidden border bg-muted">
              <iframe
                src={venue.contact.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${venue.name}位置地圖`}
              />
            </div>
          </div>
        )}


        {/* 操作按鈕 */}
        {venue.status === "active" && (
          <div className="pt-2">
            <Button className="w-full" asChild>
              <a href={`tel:${venue.contact.phone}`}>
                立即致電預約
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}