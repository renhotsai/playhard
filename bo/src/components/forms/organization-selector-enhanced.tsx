"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  AlertCircle, 
  Loader2, 
  Check, 
  ChevronsUpDown,
  Search,
  RefreshCw,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrganizationsSimple, useOrganizationsAdvanced } from "@/hooks/use-organizations-advanced";
import { useDebouncedCallback } from 'use-debounce';

/**
 * Enhanced Organization Selector Props
 */
interface OrganizationSelectorEnhancedProps {
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
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable member count display */
  showMemberCount?: boolean;
  /** Enable prefetching for better performance */
  enablePrefetch?: boolean;
  /** Custom width class */
  width?: string;
  /** Data test ID for testing */
  "data-testid"?: string;
  /** ARIA described by for accessibility */
  "aria-describedby"?: string;
  /** ARIA invalid for form validation */
  "aria-invalid"?: boolean;
}

/**
 * Enhanced Organization Selector with Advanced TanStack Query Features
 * 
 * Features:
 * - Search functionality with debounced queries
 * - Advanced caching with background refetching
 * - Prefetching for better performance
 * - Optimistic updates
 * - Error boundaries and loading states
 * - Accessibility compliance
 * - Member count display
 */
export function OrganizationSelectorEnhanced({
  value,
  onValueChange,
  disabled = false,
  required = false,
  label = "Organization",
  placeholder = "Select an organization",
  helpText,
  error,
  enableSearch = true,
  showMemberCount = true,
  enablePrefetch = true,
  width = "w-full",
  "data-testid": dataTestId = "organization-selector-enhanced",
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: OrganizationSelectorEnhancedProps) {
  // State management
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Choose appropriate hook based on search requirement
  const simpleQuery = useOrganizationsSimple();
  const advancedQuery = useOrganizationsAdvanced({
    enableSearch,
    enablePrefetch,
    searchQuery,
  });

  // Use appropriate query based on search functionality
  const query = enableSearch ? advancedQuery : simpleQuery;
  const { data, isLoading, isError, error: queryError, refetch } = query;

  // Extract organizations from response
  const organizationsData = useMemo(() => {
    if (enableSearch && 'organizations' in query) {
      return query.organizations || [];
    }
    if (!enableSearch && data && 'organizations' in data) {
      return data.organizations || [];
    }
    if (data && 'data' in data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }, [enableSearch, query, data]);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback((searchValue: string) => {
    setSearchQuery(searchValue);
    setIsSearching(false);
  }, 300);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setIsSearching(true);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle organization selection
  const handleSelect = useCallback((selectedValue: string) => {
    if (selectedValue === value) {
      // Deselect if same value clicked
      onValueChange("");
    } else {
      onValueChange(selectedValue);
      
      // Prefetch organization details for better UX
      if ('prefetchOrganization' in query) {
        query.prefetchOrganization(selectedValue);
      }
    }
    setOpen(false);
    setSearchQuery("");
  }, [value, onValueChange, query]);

  // Find selected organization
  const selectedOrganization = useMemo(() => {
    return organizationsData.find(org => org.id === value);
  }, [organizationsData, value]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && organizationsData.length === 0) {
    return (
      <div className="space-y-2" data-testid={`${dataTestId}-loading`}>
        <Label htmlFor={dataTestId}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex items-center space-x-2">
          <Skeleton className={cn("h-10", width)} />
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
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {queryError?.message || "Failed to load organizations"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="ml-2 h-auto p-1"
              type="button"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="sr-only">Retry</span>
            </Button>
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
  if (organizationsData.length === 0) {
    return (
      <div className="space-y-2" data-testid={`${dataTestId}-empty`}>
        <Label htmlFor={dataTestId}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className={cn("flex items-center space-x-2 p-3 border rounded-md bg-muted text-muted-foreground", width)}>
          <Building2 className="h-4 w-4" />
          <span className="text-sm">
            No organizations available
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="ml-auto h-auto p-1"
            type="button"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="sr-only">Refresh</span>
          </Button>
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
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid || !!error}
            aria-required={required}
            disabled={disabled}
            className={cn(
              "justify-between font-normal",
              width,
              error && "border-destructive",
              !selectedOrganization && "text-muted-foreground"
            )}
            id={`${dataTestId}-select`}
            data-testid={`${dataTestId}-trigger`}
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {selectedOrganization ? (
                <>
                  <Building2 className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="truncate">{selectedOrganization.name}</span>
                    {showMemberCount && (
                      <span className="text-xs text-muted-foreground">
                        {selectedOrganization.memberCount || 0} member{(selectedOrganization.memberCount || 0) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{placeholder}</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className={cn("p-0", width)} 
          align="start"
          data-testid={`${dataTestId}-content`}
        >
          <Command shouldFilter={!enableSearch}>
            {enableSearch && (
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                  className="flex h-11"
                />
                {(isSearching || isLoading) && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                )}
              </div>
            )}
            
            <CommandList>
              <CommandEmpty>
                {enableSearch ? "No organizations found." : "No organizations available."}
              </CommandEmpty>
              
              <CommandGroup>
                {organizationsData.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.id}
                    onSelect={handleSelect}
                    className="flex items-center space-x-2 py-2"
                    data-testid={`${dataTestId}-option-${org.slug}`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{org.name}</span>
                          {org.slug && (
                            <Badge variant="secondary" className="text-xs">
                              {org.slug}
                            </Badge>
                          )}
                        </div>
                        {showMemberCount && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{org.memberCount || 0} member{(org.memberCount || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === org.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center space-x-1" role="alert">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
      
      {/* Help text */}
      {!error && helpText && (
        <p className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}
      
      {/* Success indicator with cache status */}
      {!error && !helpText && organizationsData.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {organizationsData.length} organization{organizationsData.length !== 1 ? 's' : ''} available
          </span>
          {isLoading && (
            <div className="flex items-center space-x-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizationSelectorEnhanced;