"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Script } from "@/data/scripts";

const colorMap = {
  "chart-1": "bg-orange-500",
  "chart-2": "bg-blue-500", 
  "chart-3": "bg-green-500",
  "chart-4": "bg-purple-500",
  "chart-5": "bg-red-500"
} as const;

interface ScriptCardProps {
  script: Script;
  showButton?: boolean;
  buttonText?: string;
  className?: string;
  onButtonClick?: (script: Script) => void;
  enableDetailNavigation?: boolean;
}

export default function ScriptCard({ 
  script, 
  showButton = false, 
  buttonText = "查看詳情",
  className = "",
  onButtonClick,
  enableDetailNavigation = true
}: ScriptCardProps) {
  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick(script);
    } else if (enableDetailNavigation) {
      window.location.href = `/games/${script.id}`;
    }
  };

  return (
    <Card className={`hover:scale-105 transition-transform duration-300 cursor-pointer ${className}`}>
      {script.image && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <Image 
            src={script.image} 
            alt={script.title}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl">{script.title}</CardTitle>
          <Badge className={`${colorMap[script.color as keyof typeof colorMap] || 'bg-gray-500'} text-white`}>{script.category}</Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          {script.category} • {script.players} 人 • {script.duration} 小時
          {script.difficulty && ` • ${script.difficulty}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {script.description}
        </p>
        <div className="flex flex-wrap gap-1 mb-4">
          {script.features.map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
        {showButton && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleButtonClick}
          >
            {buttonText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}