"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, AlertCircle, Loader2 } from "lucide-react";
import { useOrganizationsSelector } from "@/hooks/use-organizations-selector";

/**
 * Props for the OrganizationSelector component
 */
interface OrganizationSelectorProps {
  /** Current selected organization ID */
  value?: string;
  /** Callback when organization selection changes */
  onValueChange: (organizationId: string) => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is required */
  required?: boolean;
  /** Label text for the field */
  label?: string;
  /** Placeholder text when no option is selected */
  placeholder?: string;
  /** Help text to display below the selector */
  helpText?: string;
  /** Error message to display */
  error?: string;
  /** Data test ID for testing */
  "data-testid"?: string;
  /** ARIA described by for accessibility */
  "aria-describedby"?: string;
  /** ARIA invalid for form validation */
  "aria-invalid"?: boolean;
}

/**
 * Enhanced organization selector component with TanStack Query integration
 * Features loading states, error handling, and empty states
 */
export function OrganizationSelector({
  value,
  onValueChange,
  disabled = false,
  required = false,
  label = "Organization",
  placeholder = "Select an organization",
  helpText,
  error,
  "data-testid": dataTestId = "organization-selector",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: OrganizationSelectorProps) {
  const { 
    data: organizationsData, 
    isLoading, 
    isError, 
    error: queryError,
    refetch 
  } = useOrganizationsSelector();

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2" data-testid={`${dataTestId}-loading`}>
        <Label htmlFor={dataTestId}>
          {label} {required && "*"}
        </Label>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-full" />
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Loading organizations...
        </p>
      </div>
    );
  }

  // Error state
  if (isError || queryError) {
    return (
      <div className="space-y-2" data-testid={`${dataTestId}-error`}>
        <Label htmlFor={dataTestId}>
          {label} {required && "*"}
        </Label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {queryError?.message || "Failed to load organizations"}
            </span>
            <button
              onClick={() => refetch()}
              className="ml-2 text-xs underline hover:no-underline"
              type="button"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
        {helpText && (
          <p className="text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }

  // Empty state
  if (!organizationsData?.organizations?.length) {
    return (
      <div className="space-y-2" data-testid={`${dataTestId}-empty`}>
        <Label htmlFor={dataTestId}>
          {label} {required && "*"}
        </Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">
            No organizations available
          </span>
        </div>
        <p className="text-xs text-amber-600">
          No organizations found. You may need to create an organization first.
        </p>
      </div>
    );
  }

  // Success state with organizations
  return (
    <div className="space-y-2" data-testid={dataTestId}>
      <Label htmlFor={`${dataTestId}-select`}>
        {label} {required && "*"}
      </Label>
      <Select 
        value={value || ""} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={`${dataTestId}-select`}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || !!error}
          aria-required={required}
          data-testid={`${dataTestId}-trigger`}
          className={error ? "border-destructive" : ""}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent data-testid={`${dataTestId}-content`}>
          {organizationsData.organizations.map((org) => (
            <SelectItem 
              key={org.id} 
              value={org.id}
              data-testid={`${dataTestId}-option-${org.slug}`}
            >
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {org.slug}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      
      {/* Help text */}
      {!error && helpText && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {/* Success indicator */}
      {!error && !helpText && organizationsData.organizations.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {organizationsData.organizations.length} organization{organizationsData.organizations.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
}