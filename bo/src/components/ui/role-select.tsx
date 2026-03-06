"use client";

import * as React from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ROLE_CATEGORIES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  type OrganizationRole 
} from "@/lib/roles";
import { cn } from "@/lib/utils";

interface RoleSelectProps {
  value?: OrganizationRole;
  onValueChange?: (value: OrganizationRole) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  "data-testid"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
}

/**
 * Role Selection Component
 * 
 * A specialized select component for choosing murder mystery roles with organized categories.
 * Displays business roles (owner, admin) and game roles (gm, staff, player) in separate groups.
 * 
 * Features:
 * - Grouped options with category headers
 * - Rich role descriptions for better UX
 * - Full accessibility support
 * - Consistent shadcn/ui styling
 * - TypeScript integration with role constants
 */
export function RoleSelect({
  value,
  onValueChange,
  placeholder = "Select a role",
  disabled = false,
  size = "default",
  className,
  "data-testid": testId,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: RoleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        className={cn("w-full", className)}
        data-testid={testId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Business Roles Group */}
        <SelectGroup>
          <SelectLabel className="flex flex-col gap-1 px-2 py-2">
            <span className="font-medium text-foreground">
              {ROLE_CATEGORIES.business.label}
            </span>
            <span className="text-xs text-muted-foreground font-normal leading-relaxed">
              {ROLE_CATEGORIES.business.description}
            </span>
          </SelectLabel>
          {ROLE_CATEGORIES.business.roles.map((role) => (
            <SelectItem 
              key={role} 
              value={role}
              data-testid={`role-option-${role}`}
            >
              <div className="flex flex-col gap-1 py-1">
                <span className="font-medium">
                  {ROLE_DISPLAY_NAMES[role]}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        {/* Game Roles Group */}
        <SelectGroup>
          <SelectLabel className="flex flex-col gap-1 px-2 py-2 mt-2">
            <span className="font-medium text-foreground">
              {ROLE_CATEGORIES.game.label}
            </span>
            <span className="text-xs text-muted-foreground font-normal leading-relaxed">
              {ROLE_CATEGORIES.game.description}
            </span>
          </SelectLabel>
          {ROLE_CATEGORIES.game.roles.map((role) => (
            <SelectItem 
              key={role} 
              value={role}
              data-testid={`role-option-${role}`}
            >
              <div className="flex flex-col gap-1 py-1">
                <span className="font-medium">
                  {ROLE_DISPLAY_NAMES[role]}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * Hook for getting role display information
 * Useful for showing selected role details outside the select component
 */
export function useRoleInfo(role?: OrganizationRole) {
  return React.useMemo(() => {
    if (!role) return null;
    
    return {
      displayName: ROLE_DISPLAY_NAMES[role],
      description: ROLE_DESCRIPTIONS[role],
      category: ROLE_CATEGORIES.business.roles.includes(role) ? 'business' : 'game',
      categoryLabel: ROLE_CATEGORIES.business.roles.includes(role) 
        ? ROLE_CATEGORIES.business.label 
        : ROLE_CATEGORIES.game.label,
    };
  }, [role]);
}