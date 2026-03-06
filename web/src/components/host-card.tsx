import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

interface HostCardProps {
  name: string;
  avatar?: string;
  instagramHandle?: string;
}

export default function HostCard({
  name,
  avatar,
  instagramHandle
}: HostCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center space-y-4">
          <UserAvatar 
            displayName={name}
            avatarUrl={avatar}
            size="lg"
            fallbackClassName="text-xl font-semibold bg-primary text-primary-foreground"
          />
          <CardTitle className="text-xl">{name}</CardTitle>
        </div>
      </CardHeader>
      {instagramHandle && (
        <CardContent className="pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Instagram className="h-4 w-4" />
              @{instagramHandle}
            </a>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}