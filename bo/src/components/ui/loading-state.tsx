import { Loader2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Label } from "./label";

// Main loading component with flexible sizing and full-screen option

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({ 
  message = "Loading...", 
  size = "md", 
  className,
  fullScreen = false
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const containerClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12"
  };
  
  const fullScreenClasses = fullScreen ? "min-h-screen fixed inset-0 bg-background/80 backdrop-blur-sm z-50" : "";

  return (
    <div className={cn(
      "flex items-center justify-center",
      fullScreen ? fullScreenClasses : containerClasses[size],
      className
    )}
    role="status"
    aria-live="polite"
    aria-label={message}
    >
      <div className="flex items-center gap-2">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} aria-hidden="true" />
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

// Specialized loading components for common patterns
export const LoadingSpinner = ({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };
  
  return (
    <Loader2 
      className={cn("animate-spin text-primary", sizeClasses[size], className)} 
      aria-hidden="true" 
    />
  );
};

// Full screen loading overlay
export const LoadingOverlay = ({ message = "Loading..." }: { message?: string }) => (
  <LoadingState message={message} fullScreen size="lg" />
);

// Inline loading for buttons and small components
export const LoadingInline = ({ message = "Loading..." }: { message?: string }) => (
  <LoadingState message={message} size="sm" className="py-2" />
);

// Card/section loading
export const LoadingCard = ({ message = "Loading..." }: { message?: string }) => (
  <LoadingState message={message} size="md" className="py-8" />
);

// Page loading (for main content areas)
export const LoadingPage = ({ message = "Loading..." }: { message?: string }) => (
  <LoadingState message={message} size="lg" className="py-12" />
);

// Role Selection Loading Components

interface RoleSelectionLoadingProps {
  message?: string;
  sections?: number;
  rolesPerSection?: number;
  showOrganizationSelect?: boolean;
  className?: string;
}

// Complete role selection interface loading state
export function RoleSelectionLoading({
  message = "Loading role options...",
  sections = 2,
  rolesPerSection = 3,
  showOrganizationSelect = false,
  className
}: RoleSelectionLoadingProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Loading message with spinner */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingSpinner size="sm" />
        <span>{message}</span>
      </div>

      {/* Role sections skeleton */}
      <div className="space-y-8">
        {Array.from({ length: sections }).map((_, sectionIndex) => (
          <Card key={sectionIndex} className="w-full">
            <CardHeader>
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" /> {/* Section title */}
                <Skeleton className="h-4 w-72" /> {/* Section description */}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: rolesPerSection }).map((_, roleIndex) => (
                  <RoleOptionSkeleton key={roleIndex} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Organization selection skeleton (conditional) */}
      {showOrganizationSelect && (
        <Card className="w-full">
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" /> {/* Title */}
              <Skeleton className="h-4 w-64" /> {/* Description */}
            </div>
          </CardHeader>
          <CardContent>
            <OrganizationSelectSkeleton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual role option skeleton (matches the role option design)
export function RoleOptionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-start space-x-3 p-3 rounded-lg border bg-card animate-pulse",
      className
    )}>
      {/* Radio button skeleton */}
      <div className="mt-0.5">
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      
      {/* Role content */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" /> {/* Role title */}
          <Skeleton className="h-5 w-16 rounded-full" /> {/* Badge */}
        </div>
        <Skeleton className="h-3 w-48" /> {/* Role description */}
      </div>
    </div>
  );
}

// Organization select dropdown skeleton
export function OrganizationSelectSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium flex items-center gap-1">
        Organization
        <span className="text-destructive">*</span>
      </Label>
      <div className="flex items-center gap-2 w-full p-3 border rounded-md bg-background">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-4" /> {/* Chevron */}
      </div>
    </div>
  );
}

// Quick role cards loading (for simplified interfaces)
export function RoleCardsLoading({ 
  count = 4, 
  message = "Loading roles...",
  className 
}: { 
  count?: number;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingSpinner size="sm" />
        <span>{message}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Organization members loading (for user lists in role context)
export function RoleMembersLoading({
  count = 5,
  message = "Loading team members...",
  className
}: {
  count?: number;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoadingSpinner size="sm" />
        <span>{message}</span>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" /> {/* Name */}
                <Skeleton className="h-3 w-24" /> {/* Email or role */}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16 rounded-full" /> {/* Role badge */}
              <Skeleton className="h-8 w-8" /> {/* Action button */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}