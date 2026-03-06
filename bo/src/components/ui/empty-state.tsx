import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md"
}: EmptyStateProps) {
  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const containerPadding = {
    sm: "py-6",
    md: "py-8", 
    lg: "py-12"
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };

  return (
    <div className={cn(
      "text-center",
      containerPadding[size],
      className
    )}>
      <Icon className={cn(
        "mx-auto text-muted-foreground mb-4",
        iconSizes[size]
      )} />
      <h3 className={cn(
        "font-semibold mb-2",
        titleSizes[size]
      )}>
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || "outline"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}