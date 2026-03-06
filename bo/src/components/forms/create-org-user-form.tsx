"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { 
  validators, 
  murderMysteryValidators, 
  tanstackFormUtils,
  asyncValidators 
} from "@/lib/form-validators";
import { 
  ROLE_DESCRIPTIONS,
  ROLE_CATEGORIES,
  getRoleDisplayName,
  getRoleCategory
} from "@/lib/roles";
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Info,
  UserCog,
  Crown
} from "lucide-react";

// Enhanced type definition matching your requirements
type CreateUserFormData = {
  email: string;
  name: string;
  userType: 'system_admin' | 'organization_user';
  organizationId?: string;
  organizationRole?: 'owner' | 'admin' | 'gm' | 'staff' | 'player';
};

interface CreateOrgUserFormProps {
  onSuccess?: () => void;
  defaultOrganizationId?: string;
}

export function CreateOrgUserForm({ onSuccess, defaultOrganizationId }: CreateOrgUserFormProps) {
  // Fetch organizations for select dropdown
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async () => {
      const response = await fetch('/api/organizations', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      return response.json();
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      userType: "organization_user" as const, // Default to organization user
      organizationId: defaultOrganizationId || "",
      organizationRole: "",
    } as CreateUserFormData,
    validators: {
      // Form-level validation for cross-field dependencies
      onChange: ({ value }) => {
        const validation = tanstackFormUtils.createUserFormValidator(value);
        return validation.hasErrors ? validation.errors : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: value.name,
            email: value.email,
            userType: value.userType,
            organizationId: value.organizationId,
            organizationRole: value.organizationRole,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "操作失敗");
          return;
        }

        toast.success(data.message);
        
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error("Create organization user error:", err);
        toast.error(err instanceof Error ? err.message : "操作失敗");
      }
    },
  });

  return (
    <form 
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-8"
      data-testid="create-user-form"
    >
      {/* Basic Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </div>
          <CardDescription>
            Enter the user&apos;s personal details. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Field */}
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => validators.name(value),
              onBlur: ({ value }) => validators.name(value),
            }}
          >
            {(field) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    Required
                  </Badge>
                </div>
                <div className="relative">
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Enter user's full name"
                    className={`pr-10 ${field.state.meta.errors.length > 0 ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                    data-testid="name-input"
                    aria-describedby={field.state.meta.errors.length > 0 ? "name-error" : "name-description"}
                  />
                  {field.state.value && field.state.meta.errors.length === 0 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {field.state.meta.errors.length > 0 && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {field.state.meta.errors.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-destructive" id="name-error">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{field.state.meta.errors[0]}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground" id="name-description">
                    Enter the user&apos;s full name as it should appear in the system
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Email Field with Async Validation */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => validators.email(value),
              onBlur: ({ value }) => validators.email(value),
              // Async validation for email uniqueness
              onChangeAsync: tanstackFormUtils.createAsyncValidator(
                asyncValidators.uniqueEmail,
                800
              ),
            }}
          >
            {(field) => (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    Required
                  </Badge>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="user@organization.com"
                    className={`pl-10 pr-10 ${field.state.meta.errors.length > 0 ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                    data-testid="email-input"
                    aria-describedby={field.state.meta.errors.length > 0 ? "email-error" : field.state.meta.isValidating ? "email-validating" : "email-description"}
                  />
                  {field.state.meta.isValidating && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!field.state.meta.isValidating && field.state.value && field.state.meta.errors.length === 0 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {field.state.meta.errors.length > 0 && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                </div>
                {field.state.meta.isValidating ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground" id="email-validating">
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span>Checking email availability...</span>
                  </div>
                ) : field.state.meta.errors.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-destructive" id="email-error">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{field.state.meta.errors[0]}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground" id="email-description">
                    A magic link invitation will be sent to this email address
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* User Type Selection Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">User Type Selection</CardTitle>
          </div>
          <CardDescription>
            Choose the type of user account to create. This determines their access level and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form.Field
            name="userType"
            validators={{
              onChange: ({ value }) => murderMysteryValidators.userType(value),
            }}
          >
            {(field) => (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="userType" className="text-sm font-medium">
                    User Type
                  </Label>
                  <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                    Required
                  </Badge>
                </div>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value);
                    // Reset organization fields when switching to system admin
                    if (value === 'system_admin') {
                      form.setFieldValue('organizationId', '');
                      form.setFieldValue('organizationRole', '');
                    }
                  }}
                >
                  <SelectTrigger 
                    className={`h-12 ${field.state.meta.errors.length > 0 ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                    data-testid="user-type-select"
                  >
                    <SelectValue placeholder="Choose user type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_admin" className="p-4">
                      <div className="flex items-start gap-3">
                        <Crown className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">System Administrator</p>
                          <p className="text-sm text-muted-foreground">
                            Full access to all organizations and system settings
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="organization_user" className="p-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Organization User</p>
                          <p className="text-sm text-muted-foreground">
                            Access limited to specific organization and assigned roles
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{field.state.meta.errors[0]}</span>
                  </div>
                ) : field.state.value ? (
                  <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">
                          {field.state.value === 'system_admin' ? 'System Administrator Access' : 'Organization User Access'}
                        </p>
                        <p className="text-muted-foreground">
                          {field.state.value === 'system_admin'
                            ? 'This user will have global access across all organizations and can manage system-wide settings.'
                            : 'This user will be assigned to a specific organization and given appropriate role-based permissions.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a user type to see access level details
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>

      {/* Conditional Organization Assignment Section */}
      <form.Field
        name="organizationId"
        validators={{
          onChange: tanstackFormUtils.createConditionalValidator(
            (formData: CreateUserFormData) => formData.userType === 'organization_user',
            (value: string) => murderMysteryValidators.organizationId(value, true),
            "Organization is required for organization users"
          ),
        }}
      >
        {(field) => {
          const userType = form.getFieldValue('userType');
          const isRequired = userType === 'organization_user';
          
          return (
            <Card className={`transition-all duration-200 ${
              !isRequired ? 'opacity-60 bg-muted/50' : ''
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Organization Assignment
                    {isRequired && (
                      <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">
                        Required
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <CardDescription>
                  {isRequired 
                    ? 'Select the organization this user will be assigned to.'
                    : 'System administrators have access to all organizations automatically.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`space-y-4 transition-opacity duration-200 ${
                  !isRequired ? 'pointer-events-none' : ''
                }`}>
                  <Label htmlFor="organizationId" className="text-sm font-medium">
                    Organization
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isLoadingOrgs || !isRequired}
                  >
                    <SelectTrigger 
                      className={`h-12 ${field.state.meta.errors.length > 0 ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                      data-testid="organization-select"
                    >
                      <SelectValue placeholder={
                        isLoadingOrgs ? "Loading organizations..." : 
                        !isRequired ? "Not required for system administrators" :
                        "Choose organization..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationsData?.organizations?.map((org: { id: string; name: string }) => (
                        <SelectItem key={org.id} value={org.id} className="p-3">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{org.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{field.state.meta.errors[0]}</span>
                    </div>
                  ) : !isRequired ? (
                    <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground mb-1">Global Access Enabled</p>
                          <p className="text-muted-foreground">
                            System administrators automatically have access to all organizations in the system.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Select the organization where this user will have access
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }}
      </form.Field>

      {/* Enhanced Organization Role Field with Murder Mystery Roles */}
      <form.Field
        name="organizationRole"
        validators={{
          onChange: tanstackFormUtils.createConditionalValidator(
            (formData: CreateUserFormData) => formData.userType === 'organization_user',
            (value: string) => murderMysteryValidators.organizationRoleEnhanced(value, true),
            "Organization role is required for organization users"
          ),
        }}
      >
        {(roleField) => {
          const userType = form.getFieldValue('userType');
          const isRequired = userType === 'organization_user';
          
          return (
            <Card className={`transition-all duration-200 ${
              !isRequired ? 'opacity-60 bg-muted/50' : ''
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    Role Assignment
                    {isRequired && (
                      <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">
                        Required
                      </Badge>
                    )}
                  </CardTitle>
                </div>
                <CardDescription>
                  {isRequired 
                    ? 'Select the specific role this user will have within their organization.'
                    : 'System administrators have all permissions and do not need specific roles.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`space-y-4 transition-opacity duration-200 ${
                  !isRequired ? 'pointer-events-none' : ''
                }`}>
                  <Label htmlFor="organizationRole" className="text-sm font-medium">
                    Organization Role
                  </Label>
                  <Select
                    value={roleField.state.value}
                    onValueChange={(value) => roleField.handleChange(value)}
                    disabled={!isRequired}
                  >
                    <SelectTrigger 
                      className={`h-12 ${roleField.state.meta.errors.length > 0 ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
                      data-testid="role-select"
                    >
                      <SelectValue placeholder={
                        !isRequired ? "Not required for system administrators" : "Choose role..."
                      } />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {/* Business Roles Section */}
                      <div className="px-3 py-2 bg-muted/50">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          {ROLE_CATEGORIES.business.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ROLE_CATEGORIES.business.description}
                        </p>
                      </div>
                      {ROLE_CATEGORIES.business.roles.map((role) => (
                        <SelectItem key={role} value={role} className="p-4">
                          <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{getRoleDisplayName(role)}</p>
                              <p className="text-sm text-muted-foreground">
                                {ROLE_DESCRIPTIONS[role]}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      
                      <Separator className="my-2" />
                      
                      {/* Game Roles Section */}
                      <div className="px-3 py-2 bg-muted/50">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          {ROLE_CATEGORIES.game.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ROLE_CATEGORIES.game.description}
                        </p>
                      </div>
                      {ROLE_CATEGORIES.game.roles.map((role) => (
                        <SelectItem key={role} value={role} className="p-4">
                          <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{getRoleDisplayName(role)}</p>
                              <p className="text-sm text-muted-foreground">
                                {ROLE_DESCRIPTIONS[role]}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {roleField.state.meta.errors.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{roleField.state.meta.errors[0]}</span>
                    </div>
                  ) : isRequired && roleField.state.value ? (
                    <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                      <div className="flex items-start gap-3">
                        <Badge 
                          variant={getRoleCategory(roleField.state.value) === 'business' ? 'default' : 'secondary'}
                          className="mt-0.5"
                        >
                          {getRoleCategory(roleField.state.value) === 'business' ? 'Business' : 'Game'} Role
                        </Badge>
                        <div className="text-sm">
                          <p className="font-medium text-foreground mb-1">
                            {getRoleDisplayName(roleField.state.value)}
                          </p>
                          <p className="text-muted-foreground">
                            {ROLE_DESCRIPTIONS[roleField.state.value as keyof typeof ROLE_DESCRIPTIONS]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : !isRequired ? (
                    <div className="rounded-lg bg-muted/50 p-4 border border-muted">
                      <div className="flex items-start gap-3">
                        <Crown className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-foreground mb-1">Administrator Privileges</p>
                          <p className="text-muted-foreground">
                            System administrators have all permissions and do not require specific role assignments.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Select the role that defines this user&apos;s permissions and responsibilities
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }}
      </form.Field>

      {/* Form Summary and Submit Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Review & Submit</CardTitle>
          </div>
          <CardDescription>
            Review the user details below and submit to create the account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Form Summary */}
          <form.Subscribe
            selector={(state) => state.values}
          >
            {(values) => {
              if (!values.userType) {
                return (
                  <div className="rounded-lg border-2 border-dashed border-muted p-6 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Complete the form above to see a summary of the user that will be created
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="rounded-lg border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold">User Summary</h4>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">Name:</span>
                      <span className="text-sm font-medium">{values.name || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium">{values.email || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-muted">
                      <span className="text-sm font-medium text-muted-foreground">User Type:</span>
                      <Badge variant={values.userType === 'system_admin' ? 'default' : 'secondary'}>
                        {values.userType === 'system_admin' ? 'System Administrator' : 'Organization User'}
                      </Badge>
                    </div>
                    {values.userType === 'organization_user' && (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-muted">
                          <span className="text-sm font-medium text-muted-foreground">Organization:</span>
                          <span className="text-sm font-medium">
                            {organizationsData?.organizations?.find(
                              (org: { id: string; name: string }) => org.id === values.organizationId
                            )?.name || 'Not selected'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium text-muted-foreground">Role:</span>
                          <div className="flex items-center gap-2">
                            {values.organizationRole ? (
                              <>
                                <Badge variant={getRoleCategory(values.organizationRole) === 'business' ? 'default' : 'secondary'}>
                                  {getRoleCategory(values.organizationRole)} Role
                                </Badge>
                                <span className="text-sm font-medium">{getRoleDisplayName(values.organizationRole)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-medium">Not selected</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Invitation Process
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          {values.userType === 'system_admin'
                            ? 'A magic link invitation will be sent to create this system administrator account.'
                            : 'A magic link invitation will be sent for the user to join the selected organization.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </form.Subscribe>
          
          {/* Enhanced Submit Button */}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting, state.isValidating]}
          >
            {([canSubmit, isFormSubmitting, isValidating]) => {
              const userType = form.getFieldValue('userType');
              const buttonText = isFormSubmitting 
                ? 'Creating user...'
                : userType === 'system_admin'
                ? 'Create System Administrator'
                : 'Send Organization Invitation';
              
              const buttonIcon = isFormSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isValidating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : userType === 'system_admin' ? (
                <Crown className="h-4 w-4" />
              ) : (
                <Mail className="h-4 w-4" />
              );
              
              return (
                <Button 
                  type="submit" 
                  disabled={!canSubmit || isFormSubmitting || isValidating}
                  className="w-full h-12 text-base font-medium"
                  data-testid="submit-button"
                >
                  <div className="flex items-center gap-2">
                    {buttonIcon}
                    <span>
                      {isValidating ? 'Validating...' : buttonText}
                    </span>
                  </div>
                </Button>
              );
            }}
          </form.Subscribe>
        </CardContent>
      </Card>
    </form>
  );
}