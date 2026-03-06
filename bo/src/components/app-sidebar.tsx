import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Shield, Settings, Users, Building2, Crown, ChevronDown, BarChart3, Calendar, Store, BookOpen, UserCheck, UserCog } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { OrganizationSelector } from "@/components/organization-selector";
import { usePermissionChecks } from "@/hooks/use-permissions";

// Unified Menu Data - Permission-Based Display
const getUnifiedMenuData = (permissions: ReturnType<typeof usePermissionChecks>) => {
	const baseMenu = [];

	// System Management - Based on reports permission (admin functionality)
	if (permissions?.canViewReports) {
		baseMenu.push({
			label: "系統管理",
			icon: Settings,
			items: [
				{ id: 1, title: "系統概覽", link: "/dashboard/admin", icon: BarChart3 },
				{ id: 2, title: "全域設置", link: "/dashboard/admin/settings", icon: Settings },
			],
		});
	}

	// Brand/Organization Management
	if (permissions?.canViewOrganizations) {
		baseMenu.push({
			label: "品牌管理",
			icon: Building2,
			items: [
				{ id: 1, title: "所有品牌", link: "/dashboard/admin/organizations", icon: Building2 },
				...(permissions.canCreateOrganizations ? [
					{ id: 2, title: "創建品牌", link: "/dashboard/admin/organizations/create", icon: Building2 },
				] : [])
			],
		});
	}

	// User Management
	if (permissions?.canViewUsers) {
		baseMenu.push({
			label: "用戶管理",
			icon: Users,
			items: [
				{ id: 1, title: "系統用戶", link: "/dashboard/admin/users", icon: Users },
				...(permissions.canCreateUsers ? [
					{ id: 2, title: "創建用戶", link: "/dashboard/admin/users/create", icon: UserCheck },
				] : [])
			],
		});
	}

	// Permission Management
	if (permissions?.canViewPermissions) {
		const permissionItems = [
			{ id: 1, title: "權限矩陣", link: "/dashboard/admin/permissions", icon: Crown },
		];

		if (permissions?.canViewSystemRoles) {
			permissionItems.push({ id: 2, title: "系統角色", link: "/dashboard/admin/permissions/system-roles", icon: UserCog });
		}
		
		if (permissions?.canViewOrgRoles) {
			permissionItems.push({ id: 3, title: "組織角色", link: "/dashboard/admin/permissions/org-roles", icon: Users });
		}

		baseMenu.push({
			label: "權限管理",
			icon: Crown,
			items: permissionItems,
		});
	}

	// Script Management - Gaming Platform Feature
	if (permissions?.canViewScripts) {
		baseMenu.push({
			label: "劇本管理",
			icon: BookOpen,
			items: [
				{ id: 1, title: "劇本列表", link: "/dashboard/scripts", icon: BookOpen },
				...(permissions.canManageScripts ? [
					{ id: 2, title: "新增劇本", link: "/dashboard/scripts/create", icon: BookOpen },
					{ id: 3, title: "劇本分類", link: "/dashboard/scripts/categories", icon: BookOpen },
				] : [])
			]
		});
	}

	// Store Management
	if (permissions?.canViewStores) {
		baseMenu.push({
			label: "門店管理",
			icon: Store,
			items: [
				{ id: 1, title: "門店列表", link: "/dashboard/stores", icon: Store },
				...(permissions.canManageStores ? [
					{ id: 2, title: "新增門店", link: "/dashboard/stores/create", icon: Store },
					{ id: 3, title: "門店設置", link: "/dashboard/stores/settings", icon: Settings },
				] : [])
			]
		});
	}

	// Session Management
	if (permissions?.canViewSessions) {
		baseMenu.push({
			label: "場次管理",
			icon: Calendar,
			items: [
				{ id: 1, title: "場次安排", link: "/dashboard/sessions", icon: Calendar },
				{ id: 2, title: "預約管理", link: "/dashboard/bookings", icon: Calendar },
				...(permissions.canManageSessions ? [
					{ id: 3, title: "時段設置", link: "/dashboard/sessions/slots", icon: Calendar },
				] : [])
			]
		});
	}

	// Member Management - Show when user can view users
	if (permissions?.canViewUsers) {
		baseMenu.push({
			label: "成員管理",
			icon: Users,
			items: [
				{ id: 1, title: "組織成員", link: "/dashboard/organizations/members", icon: Users },
				...(permissions.canCreateUsers ? [
					{ id: 2, title: "邀請成員", link: "/dashboard/organizations/members/invite", icon: UserCheck },
				] : [])
			],
		});
	}

	// Analytics & Monitoring
	if (permissions?.canViewReports) {
		baseMenu.push({
			label: "監控分析",
			icon: BarChart3,
			items: [
				{ id: 1, title: "系統分析", link: "/dashboard/admin/analytics", icon: BarChart3 },
				{ id: 2, title: "用戶活動", link: "/dashboard/admin/activity", icon: Users },
			],
		});
	}

	return baseMenu;
};



export function AppSidebar () {
	const {
		data: session,
	} = authClient.useSession()
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const [avatarFallback, setAvatarFallback] = useState("AF")
	
	// Use new permission system for capability checks
	const permissions = usePermissionChecks(activeOrganization?.id);
	
	// Determine user capabilities - use from permissions hook instead
	const isUserSystemAdmin = permissions?.isSystemAdmin;
	const hasOrgMembership = activeOrganization?.members && activeOrganization.members.length > 0;
	
	// Get unified menu data based on permissions
	const currentMenuData = getUnifiedMenuData(permissions);

	useEffect(() => {
		if (session?.user.name) {
			setAvatarFallback(getInitials(session.user.name));
		}
	}, [session]);

	const getInitials = (name: string) => {
		if (!name) return "";

		const parts = name.trim().split(/\s+/);

		if (parts.length >= 3) {
			return (
				parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
			);
		}

		return parts.map(word => word[0].toUpperCase()).join("");
	}


	return (
		<Sidebar collapsible="icon" className="border-r">
			<SidebarHeader className="border-b px-2 py-4 group-data-[collapsible=icon]:px-2">
				{/* Simplified Header */}
				<div className="flex items-center gap-2 min-w-0 overflow-hidden">
					<div className={`rounded-lg p-2 flex-shrink-0 group-data-[collapsible=icon]:mx-auto ${
						isUserSystemAdmin ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'
					}`}>
						{isUserSystemAdmin ? (
							<Crown className="h-4 w-4 flex-shrink-0"/>
						) : (
							<Shield className="h-4 w-4 flex-shrink-0"/>
						)}
					</div>
					<div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
						<span className="text-sm font-semibold truncate">PlayHard 劇本殺</span>
						<div className="flex items-center gap-2">
							<span className="text-xs text-muted-foreground truncate">
								權限管理面板
							</span>
							{isUserSystemAdmin && (
								<Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
									ADMIN
								</Badge>
							)}
						</div>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				{/* Organization Selector - Show when user has organization memberships */}
				{hasOrgMembership && (
					<div className="mb-4 border-b pb-4">
						<OrganizationSelector />
					</div>
				)}

				{/* Navigation Menu */}
				<SidebarMenu>
					{currentMenuData.map((section) => (
						<Collapsible key={section.label} className="group/collapsible">
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton className="font-medium">
										<section.icon className="h-4 w-4" />
										<span>{section.label}</span>
										<ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{section.items.map((item) => (
											<SidebarMenuSubItem key={item.id}>
												<SidebarMenuSubButton asChild>
													<Link href={item.link} className="flex items-center gap-2">
														<item.icon className="h-3 w-3 text-muted-foreground" />
														{item.title}
													</Link>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</SidebarMenuItem>
						</Collapsible>
					))}
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter className="border-t p-4">
				<div className="flex items-center justify-between space-x-2">
					{/* 左側：Avatar + 使用者名稱 */}
					<div className="flex items-center space-x-2 min-w-0 overflow-hidden group-data-[collapsible=icon]:justify-center">
						<Avatar className="h-8 w-8 flex-shrink-0">
							<AvatarFallback>{avatarFallback}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
							<span className="text-sm font-medium truncate">{session?.user.name}</span>
							{isUserSystemAdmin && (
								<div className="flex items-center gap-1">
									<Crown className="h-3 w-3 text-orange-500" />
									<span className="text-xs text-muted-foreground">系統管理員</span>
								</div>
							)}
						</div>
					</div>

					{/* 右側：登出按鈕 */}
					<Button
						variant="ghost"
						size="sm"
						onClick={async () => {
							try {
								await authClient.signOut();
								window.location.href = '/login';
							} catch (error) {
								console.error('Logout error:', error);
							}
						}}
						className="flex items-center text-xs text-muted-foreground hover:text-foreground p-1 h-auto group-data-[collapsible=icon]:px-2"
					>
						<LogOut className="h-3 w-3 mr-1 group-data-[collapsible=icon]:mr-0" />
						<span className="group-data-[collapsible=icon]:hidden">Sign out</span>
					</Button>
				</div>
			</SidebarFooter>
			<SidebarRail/>
		</Sidebar>
	)
}