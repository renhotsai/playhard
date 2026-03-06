import * as React from "react";
import { 
  AlertCircle, 
  RefreshCw, 
  WifiOff, 
  ShieldAlert, 
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  Mail,
  LucideIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Error types that determine the icon and default messaging
 */
export type ErrorType = 
  | "general"      // Generic errors - AlertCircle icon
  | "network"      // Network/connectivity errors - WifiOff icon  
  | "permission"   // Authorization/permission errors - ShieldAlert icon
  | "validation"   // Form/input validation errors - AlertTriangle icon
  | "notFound"     // Resource not found errors - HelpCircle icon
  | "custom";      // Custom icon provided via props

/**
 * Built-in error configurations for common scenarios
 */
const ERROR_CONFIGS: Record<Exclude<ErrorType, "custom">, {
  icon: LucideIcon;
  title: string;
  message: string;
}> = {
  general: {
    icon: AlertCircle,
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again or contact support if the problem persists.",
  },
  network: {
    icon: WifiOff,
    title: "Connection problem",
    message: "Unable to connect to the server. Please check your internet connection and try again.",
  },
  permission: {
    icon: ShieldAlert,
    title: "Access denied",
    message: "You don't have permission to access this resource. Contact your administrator if you believe this is an error.",
  },
  validation: {
    icon: AlertTriangle,
    title: "Invalid data",
    message: "The provided information is invalid. Please check your input and try again.",
  },
  notFound: {
    icon: HelpCircle,
    title: "Not found",
    message: "The requested resource could not be found. It may have been moved or deleted.",
  },
};

/**
 * Action button configuration
 */
interface ErrorAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  icon?: LucideIcon;
  loading?: boolean;
}

interface ErrorStateProps {
  /**
   * Type of error - determines default icon, title, and message
   */
  type?: ErrorType;
  
  /**
   * Custom icon (only used when type="custom")
   */
  icon?: LucideIcon;
  
  /**
   * Error title (overrides default for error type)
   */
  title?: string;
  
  /**
   * Error message (overrides default for error type)
   */
  message?: string;
  
  /**
   * Primary action button (typically retry)
   */
  action?: ErrorAction;
  
  /**
   * Secondary action button (back, contact support, etc.)
   */
  secondaryAction?: ErrorAction;
  
  /**
   * Quick retry function (creates default retry button)
   */
  onRetry?: () => void;
  
  /**
   * Label for retry button
   */
  retryLabel?: string;
  
  /**
   * Component size
   */
  size?: "sm" | "md" | "lg";
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Show error code/ID for debugging
   */
  errorCode?: string;
  
  /**
   * Test ID for automated testing
   */
  "data-testid"?: string;
}

/**
 * Error State Component
 * 
 * A comprehensive error display component that supports different error types,
 * custom messaging, and multiple action buttons. Follows shadcn/ui design patterns
 * and provides consistent error handling UX across the role selection interface.
 * 
 * Features:
 * - Pre-configured error types with appropriate icons and messaging
 * - Support for custom icons and messages
 * - Primary and secondary action buttons
 * - Quick retry functionality
 * - Responsive sizing
 * - Accessibility support
 * - Error code display for debugging
 * 
 * @example
 * ```tsx
 * // Network error with retry
 * <ErrorState 
 *   type="network" 
 *   onRetry={() => refetch()} 
 * />
 * 
 * // Permission error with custom actions
 * <ErrorState
 *   type="permission"
 *   action={{
 *     label: "Contact Support",
 *     onClick: () => window.open('mailto:support@example.com'),
 *     icon: Mail
 *   }}
 *   secondaryAction={{
 *     label: "Go Back",
 *     onClick: () => router.back(),
 *     variant: "outline",
 *     icon: ArrowLeft
 *   }}
 * />
 * 
 * // Custom error with specific messaging
 * <ErrorState
 *   type="custom"
 *   icon={AlertTriangle}
 *   title="Role Assignment Failed"
 *   message="Unable to assign the selected role. Please verify the user has the necessary permissions."
 *   action={{
 *     label: "Retry Assignment",
 *     onClick: handleRetry,
 *     loading: isRetrying
 *   }}
 * />
 * ```
 */
export function ErrorState({
  type = "general",
  icon: customIcon,
  title: customTitle,
  message: customMessage,
  action,
  secondaryAction,
  onRetry,
  retryLabel = "Try again",
  size = "md",
  className,
  errorCode,
  "data-testid": testId,
}: ErrorStateProps) {
  // Determine icon, title, and message based on type
  const config = type === "custom" ? null : ERROR_CONFIGS[type];
  
  const Icon = type === "custom" ? customIcon || AlertCircle : config!.icon;
  const title = customTitle || config?.title || "Error";
  const message = customMessage || config?.message || "An error occurred.";

  // Size configurations
  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const containerPadding = {
    sm: "py-6 px-4",
    md: "py-8 px-6", 
    lg: "py-12 px-8"
  };

  const titleSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl"
  };

  const messageSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  // Create default retry action if onRetry is provided but no custom action
  const primaryAction = React.useMemo(() => {
    if (action) return action;
    if (onRetry) {
      return {
        label: retryLabel,
        onClick: onRetry,
        variant: "outline" as const,
        icon: RefreshCw,
      };
    }
    return null;
  }, [action, onRetry, retryLabel]);

  return (
    <div 
      className={cn(
        "text-center flex flex-col items-center",
        containerPadding[size],
        className
      )}
      data-testid={testId}
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <Icon 
        className={cn(
          "mx-auto text-destructive mb-4 flex-shrink-0",
          iconSizes[size]
        )}
        aria-hidden="true"
      />
      
      {/* Error Title */}
      <h3 className={cn(
        "font-semibold text-foreground mb-2",
        titleSizes[size]
      )}>
        {title}
      </h3>
      
      {/* Error Message */}
      <p className={cn(
        "text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed",
        messageSizes[size]
      )}>
        {message}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {/* Primary Action */}
          {primaryAction && (
            <Button
              variant={primaryAction.variant || "default"}
              onClick={primaryAction.onClick}
              disabled={primaryAction.loading}
              className="min-w-[120px]"
            >
              {primaryAction.loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                primaryAction.icon && <primaryAction.icon className="h-4 w-4 mr-2" />
              )}
              {primaryAction.label}
            </Button>
          )}
          
          {/* Secondary Action */}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "outline"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.loading}
              className="min-w-[120px]"
            >
              {secondaryAction.loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Error Code (for debugging) */}
      {errorCode && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            Error Code: {errorCode}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Pre-built error state components for common scenarios
 */
export const NetworkError = (props: Omit<ErrorStateProps, "type">) => (
  <ErrorState type="network" {...props} />
);

export const PermissionError = (props: Omit<ErrorStateProps, "type">) => (
  <ErrorState type="permission" {...props} />
);

export const ValidationError = (props: Omit<ErrorStateProps, "type">) => (
  <ErrorState type="validation" {...props} />
);

export const NotFoundError = (props: Omit<ErrorStateProps, "type">) => (
  <ErrorState type="notFound" {...props} />
);

/**
 * Hook for creating common error actions
 */
export function useErrorActions() {
  return React.useMemo(() => ({
    retry: (onRetry: () => void, loading = false): ErrorAction => ({
      label: "Try again",
      onClick: onRetry,
      variant: "outline",
      icon: RefreshCw,
      loading,
    }),
    
    goBack: (onBack: () => void): ErrorAction => ({
      label: "Go back",
      onClick: onBack,
      variant: "outline",
      icon: ArrowLeft,
    }),
    
    contactSupport: (supportEmail?: string): ErrorAction => ({
      label: "Contact support",
      onClick: () => {
        if (supportEmail) {
          window.open(`mailto:${supportEmail}`);
        } else {
          // Fallback to a generic support action
          console.log("Contact support action triggered");
        }
      },
      variant: "secondary",
      icon: Mail,
    }),
  }), []);
}