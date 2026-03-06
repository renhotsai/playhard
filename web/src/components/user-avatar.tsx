import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  displayName: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallbackClassName?: string;
  initials?: number; // 支援自訂取幾個字元，預設為1
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-12 w-12"
};

const fallbackTextSize = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm"
};

export default function UserAvatar({ 
  displayName, 
  avatarUrl, 
  size = "md",
  className,
  fallbackClassName,
  initials = 2
}: UserAvatarProps) {
  const getInitials = (name: string, count: number): string => {
    if (!name) return "";
    
    // 檢查是否包含英文字母（表示可能是英文名字）
    const hasEnglish = /[a-zA-Z]/.test(name);
    
    if (hasEnglish && count === 2) {
      // 英文名字：取每個單字的首字母
      const words = name.split(/\s+/).filter(word => word.length > 0);
      if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      }
      // 如果只有一個單字，取前兩個字母
      return name.slice(0, 2).toUpperCase();
    }
    
    if (!hasEnglish && count === 2) {
      // 中文名字：通常姓氏1字，名字1-2字，取姓氏
      if (name.length >= 3) {
        return name.slice(-1); // 取最後一字（名字的最後一個字）
      }
    }
    
    // 預設邏輯：直接取前N個字元
    return name.slice(0, count).toUpperCase();
  };

  const avatarText = getInitials(displayName, initials);
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback 
        className={cn(
          "bg-nav-primary-foreground text-nav-primary",
          fallbackTextSize[size],
          fallbackClassName
        )}
      >
        {avatarText}
      </AvatarFallback>
    </Avatar>
  );
}