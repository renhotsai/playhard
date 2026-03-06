'use client';

/**
 * User Creation Success Component
 * 
 * Displays success confirmation after user creation with navigation options
 * Following Next.js 15 App Router patterns and UX best practices
 * Integrates with existing shadcn/ui components for consistency
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  User, 
  Users, 
  Plus, 
  Home, 
  Mail, 
  Building2,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import type { UserCreationResult } from '@/types/user-management';

interface UserCreationSuccessProps {
  /**
   * User creation result from API
   */
  result: UserCreationResult;
  
  /**
   * Created user details for display
   */
  userDetails: {
    name: string;
    email: string;
    roleType: 'system_admin' | 'organization_owner' | 'organization_admin';
    organizationName?: string;
    organizationId?: string;
  };
  
  /**
   * Navigation options
   */
  onCreateAnother?: () => void;
  onViewUsers?: () => void;
  onGoToDashboard?: () => void;
  
  /**
   * Show quick actions
   */
  showQuickActions?: boolean;
}

interface NavigationAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  variant: 'default' | 'outline' | 'secondary';
  primary?: boolean;
}

export function UserCreationSuccess({
  result,
  userDetails,
  onCreateAnother,
  onViewUsers,
  onGoToDashboard,
  showQuickActions = true
}: UserCreationSuccessProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // Handle navigation with loading state
  const handleNavigation = async (actionId: string, action: () => void) => {
    setIsNavigating(actionId);
    try {
      action();
    } finally {
      // Clear loading state after a short delay to show transition
      setTimeout(() => setIsNavigating(null), 500);
    }
  };

  // Copy invitation link to clipboard
  const copyInvitationInfo = () => {
    if (result.invitationId) {
      const inviteText = `User invited: ${userDetails.name} (${userDetails.email})\nInvitation ID: ${result.invitationId}`;
      navigator.clipboard.writeText(inviteText);
      toast.success('Invitation details copied to clipboard');
    }
  };

  // Get role display information
  const getRoleInfo = (roleType: string) => {
    switch (roleType) {
      case 'system_admin':
        return {
          label: 'System Administrator',
          description: 'Full system access',
          variant: 'destructive' as const,
          icon: '🛡️'
        };
      case 'organization_owner':
        return {
          label: 'Organization Owner',
          description: userDetails.organizationName ? `Owner of ${userDetails.organizationName}` : 'Organization owner',
          variant: 'default' as const,
          icon: '👑'
        };
      case 'organization_admin':
        return {
          label: 'Organization Administrator',
          description: userDetails.organizationName ? `Admin of ${userDetails.organizationName}` : 'Organization admin',
          variant: 'secondary' as const,
          icon: '⚙️'
        };
      default:
        return {
          label: 'User',
          description: 'Standard user',
          variant: 'outline' as const,
          icon: '👤'
        };
    }
  };

  const roleInfo = getRoleInfo(userDetails.roleType);

  // Define navigation actions based on context
  const navigationActions: NavigationAction[] = [
    {
      id: 'create-another',
      label: 'Create Another User',
      description: 'Create a new user with different settings',
      icon: Plus,
      onClick: onCreateAnother || (() => {
        router.refresh(); // Refresh to clear form state
      }),
      variant: 'default',
      primary: true
    },
    {
      id: 'view-users',
      label: 'View All Users',
      description: 'Go to the users management page',
      icon: Users,
      href: '/dashboard/admin/users',
      onClick: onViewUsers,
      variant: 'outline'
    },
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      description: 'Return to the main dashboard',
      icon: Home,
      href: '/dashboard',
      onClick: onGoToDashboard,
      variant: 'secondary'
    }
  ];

  // Get contextual next steps based on role
  const getContextualActions = () => {
    const baseActions = [...navigationActions];
    
    // Add organization-specific actions
    if (userDetails.organizationId && userDetails.roleType !== 'system_admin') {
      baseActions.splice(2, 0, {
        id: 'view-org',
        label: 'View Organization',
        description: `Manage ${userDetails.organizationName || 'organization'} settings`,
        icon: Building2,
        href: `/dashboard/organizations/${userDetails.organizationId}`,
        variant: 'outline'
      });
    }

    return baseActions;
  };

  const actions = getContextualActions();

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-900">
            User Created Successfully!
          </CardTitle>
          <CardDescription className="text-green-700">
            The user has been created and an invitation email has been sent
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Details */}
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{userDetails.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{userDetails.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={roleInfo.variant} className="text-xs">
                    {roleInfo.icon} {roleInfo.label}
                  </Badge>
                  {userDetails.organizationName && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {userDetails.organizationName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {roleInfo.description}
                </p>
              </div>
              
              {/* Copy invitation details */}
              {result.invitationId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInvitationInfo}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Invitation Status */}
          {result.invitationId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Mail className="w-4 h-4" />
                <span className="font-medium">Invitation sent to {userDetails.email}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                The user will receive an email with instructions to complete their account setup
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {showQuickActions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What would you like to do next?</CardTitle>
            <CardDescription>
              Choose your next action to continue managing users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {actions.map((action, index) => {
                const isLoading = isNavigating === action.id;
                const Icon = action.icon;
                
                const buttonContent = (
                  <div className="flex items-center gap-3 p-4 text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      action.primary ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {action.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </div>
                );

                const button = (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    className="h-auto p-0 justify-start"
                    disabled={isLoading}
                    onClick={action.onClick ? () => handleNavigation(action.id, action.onClick!) : undefined}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-3 p-4">
                        <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      buttonContent
                    )}
                  </Button>
                );

                // Wrap with Link if href is provided
                if (action.href && !action.onClick) {
                  return (
                    <Link key={action.id} href={action.href}>
                      {button}
                    </Link>
                  );
                }

                return button;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Next Steps for the User</h4>
              <p className="text-sm text-muted-foreground">
                The user will receive an email invitation with a magic link to complete their account setup. 
                They will be able to set their username and access the appropriate dashboard sections based on their role.
              </p>
              {userDetails.roleType === 'system_admin' && (
                <p className="text-xs text-orange-600 font-medium mt-2">
                  ⚠️ System administrators have full access to all system features and organizations
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserCreationSuccess;