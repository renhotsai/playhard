import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

// Common skeleton patterns
export const SkeletonPatterns = {
  // Table row skeleton
  TableRow: ({ columns = 4 }: { columns?: number }) => (
    <div className="flex items-center space-x-4 py-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  ),

  // Card skeleton
  Card: () => (
    <div className="p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  ),

  // User avatar and info skeleton
  UserInfo: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),

  // Form skeleton
  Form: ({ fields = 3 }: { fields?: number }) => (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  ),

  // List item skeleton
  ListItem: () => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  ),
};

export { Skeleton }
