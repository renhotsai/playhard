'use client';

/**
 * Navigation Breadcrumb Component
 * 
 * Provides contextual breadcrumb navigation for admin workflows
 * Enhances user experience with clear navigation hierarchy
 * Follows Next.js 15 App Router patterns and shadcn/ui design
 */

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavigationBreadcrumbProps {
  /**
   * Custom breadcrumb items to override automatic generation
   */
  items?: BreadcrumbItemData[];
  
  /**
   * Current page title for the last breadcrumb item
   */
  currentPageTitle?: string;
  
  /**
   * Show home icon in the first breadcrumb
   */
  showHomeIcon?: boolean;
  
  /**
   * Maximum number of items to show before ellipsis
   */
  maxItems?: number;
  
  /**
   * Custom separator icon
   */
  separator?: React.ComponentType<{ className?: string }>;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function NavigationBreadcrumb({
  items,
  currentPageTitle,
  showHomeIcon = true,
  maxItems = 4,
  separator: SeparatorIcon = ChevronRight,
  className
}: NavigationBreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if not provided
  const breadcrumbItems = useMemo(() => {
    if (items) {
      return items;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItemData[] = [];

    // Add dashboard home
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/dashboard',
      icon: showHomeIcon ? Home : undefined
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the root path since we already added dashboard
      if (currentPath === '/dashboard') return;
      
      const isLast = index === pathSegments.length - 1;
      const label = formatSegmentLabel(segment);
      
      breadcrumbs.push({
        label: isLast && currentPageTitle ? currentPageTitle : label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      });
    });

    return breadcrumbs;
  }, [pathname, items, currentPageTitle, showHomeIcon]);

  // Handle ellipsis for long breadcrumb chains
  const displayItems = useMemo(() => {
    if (breadcrumbItems.length <= maxItems) {
      return breadcrumbItems;
    }

    const firstItem = breadcrumbItems[0];
    const lastItems = breadcrumbItems.slice(-2); // Keep last 2 items
    const hasEllipsis = breadcrumbItems.length > maxItems;

    if (hasEllipsis) {
      return [firstItem, { label: '...', isEllipsis: true }, ...lastItems];
    }

    return breadcrumbItems;
  }, [breadcrumbItems, maxItems]);

  // Format path segment to readable label
  function formatSegmentLabel(segment: string): string {
    // Handle dynamic route segments [id]
    if (segment.startsWith('[') && segment.endsWith(']')) {
      return segment.slice(1, -1);
    }

    // Convert kebab-case to title case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = 'isEllipsis' in item && item.isEllipsis;

          return (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {isEllipsis ? (
                  <BreadcrumbEllipsis className="h-4 w-4" />
                ) : isLast || item.isCurrentPage ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href!} className="flex items-center gap-2">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && (
                <BreadcrumbSeparator>
                  <SeparatorIcon className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Specialized breadcrumb for user management flows
 */
interface UserManagementBreadcrumbProps {
  currentStep?: 'list' | 'create' | 'edit' | 'view' | 'success';
  userId?: string;
  userName?: string;
  organizationName?: string;
  className?: string;
}

export function UserManagementBreadcrumb({
  currentStep = 'list',
  userId,
  userName,
  organizationName,
  className
}: UserManagementBreadcrumbProps) {
  const items: BreadcrumbItemData[] = useMemo(() => {
    const base: BreadcrumbItemData[] = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home
      },
      {
        label: 'Admin',
        href: '/dashboard/admin'
      },
      {
        label: 'Users',
        href: '/dashboard/admin/users'
      }
    ];

    switch (currentStep) {
      case 'create':
        base.push({
          label: 'Create User',
          isCurrentPage: true
        });
        break;
      
      case 'success':
        base.push({
          label: 'Create User',
          href: '/dashboard/admin/users/create'
        });
        base.push({
          label: 'Success',
          isCurrentPage: true
        });
        break;
      
      case 'edit':
        if (userId) {
          base.push({
            label: userName || 'Edit User',
            href: `/dashboard/admin/users/${userId}`
          });
          base.push({
            label: 'Edit',
            isCurrentPage: true
          });
        }
        break;
      
      case 'view':
        if (userId) {
          base.push({
            label: userName || 'User Details',
            isCurrentPage: true
          });
        }
        break;
    }

    return base;
  }, [currentStep, userId, userName]);

  return <NavigationBreadcrumb items={items} className={className} />;
}

export default NavigationBreadcrumb;