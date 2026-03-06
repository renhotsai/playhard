'use client';

/**
 * Organization Member Invitation Page
 * For organization admins to invite new members to their organization
 * Fully implements Prisma Types First Principle and TanStack patterns
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { ArrowLeft, UserPlus, Mail, Users, Building2, Crown } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useInviteOrganizationMember, useOrganizationTeams } from '@/hooks/use-user-management';
import { hasOrganizationAdminAccess } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvitationFormData {
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  teamIds: string[];
}

export default function InviteMemberPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const organizationId = session?.activeOrganizationId;
  
  // Fetch teams for team selection
  const { 
    data: teams = [], 
    isLoading: teamsLoading 
  } = useOrganizationTeams(organizationId || '');

  // Member invitation mutation
  const inviteMemberMutation = useInviteOrganizationMember();

  // Check if user has admin access
  const userMembership = session?.user && session.activeOrganization?.members ? 
    session.activeOrganization.members.find(m => m.userId === session.user.id) : null;
  
  const hasAdminAccess = userMembership ? 
    hasOrganizationAdminAccess(userMembership.role) : false;

  // Form validation functions
  const validateName = (value: string) => {
    if (!value || value.length < 2) return '姓名至少需要2個字符';
    if (value.length > 100) return '姓名不能超過100個字符';
    return undefined;
  };

  const validateEmail = (value: string) => {
    if (!value) return '電子郵件是必填項';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return '請輸入有效的電子郵件格式';
    return undefined;
  };

  const validateRole = (value: string) => {
    if (!value) return '請選擇角色';
    if (!['owner', 'admin', 'member'].includes(value)) return '無效的角色選擇';
    return undefined;
  };

  // TanStack Form setup
  const form = useForm<InvitationFormData>({
    defaultValues: {
      name: '',
      email: '',
      role: 'member' as const,
      teamIds: []
    },
    onSubmit: async ({ value }) => {
      try {
        setSuccessMessage(null);
        await inviteMemberMutation.mutateAsync(value);
        
        setSuccessMessage(`已向 ${value.email} 發送邀請郵件`);
        
        // Reset form and redirect after a short delay
        setTimeout(() => {
          form.reset();
          router.push('/dashboard/organizations/members');
        }, 2000);
      } catch (error) {
        console.error('Invitation error:', error);
      }
    }
  });

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">無組織選擇</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            請選擇組織以邀請成員
          </p>
        </div>
      </div>
    );
  }

  if (teamsLoading) {
    return <LoadingState message="載入組織資訊中..." />;
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Crown className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">訪問被拒絕</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            您需要管理員權限才能邀請成員
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/organizations/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回成員列表
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">邀請新成員</h1>
          <p className="text-muted-foreground">
            邀請新成員加入組織並分配角色和團隊
          </p>
        </div>
      </div>

      {/* Invitation Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            成員邀請表單
          </CardTitle>
          <CardDescription>
            填寫成員資訊並選擇適當的角色和團隊分配
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-6"
          >
            {/* Name Field */}
            <form.Field name="name" validators={{ onChange: validateName }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    placeholder="輸入成員姓名"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string' 
                        ? field.state.meta.errors[0] 
                        : field.state.meta.errors[0]?.message || 'Invalid value'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Email Field */}
            <form.Field name="email" validators={{ onChange: validateEmail }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="email">電子郵件 *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="輸入電子郵件地址"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={`pl-9 ${field.state.meta.errors.length > 0 ? "border-destructive" : ""}`}
                    />
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string' 
                        ? field.state.meta.errors[0] 
                        : field.state.meta.errors[0]?.message || 'Invalid value'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Role Field */}
            <form.Field name="role" validators={{ onChange: validateRole }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="role">組織角色 *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as 'owner' | 'admin' | 'member')}
                  >
                    <SelectTrigger className={field.state.meta.errors.length > 0 ? "border-destructive" : ""}>
                      <SelectValue placeholder="選擇角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">成員 - 基本權限</SelectItem>
                      <SelectItem value="admin">管理員 - 管理權限</SelectItem>
                      <SelectItem value="owner">擁有者 - 完整權限</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {typeof field.state.meta.errors[0] === 'string' 
                        ? field.state.meta.errors[0] 
                        : field.state.meta.errors[0]?.message || 'Invalid value'}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Team Assignment */}
            {teams.length > 0 && (
              <form.Field name="teamIds">
                {(field) => (
                  <div className="space-y-3">
                    <Label>團隊分配 (可選)</Label>
                    <div className="space-y-2">
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={field.state.value.includes(team.id)}
                            onCheckedChange={(checked) => {
                              const currentTeamIds = field.state.value;
                              if (checked) {
                                field.handleChange([...currentTeamIds, team.id]);
                              } else {
                                field.handleChange(
                                  currentTeamIds.filter(id => id !== team.id)
                                );
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`team-${team.id}`}
                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                          >
                            <Users className="h-3 w-3" />
                            {team.name}
                            <span className="text-muted-foreground">
                              ({team._count.teammembers} 成員)
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      選擇此成員應該加入的團隊，可以選擇多個團隊
                    </p>
                  </div>
                )}
              </form.Field>
            )}

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={!form.state.canSubmit || inviteMemberMutation.isPending}
                className="flex items-center gap-2"
              >
                {inviteMemberMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <Mail className="h-4 w-4" />
                發送邀請
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/dashboard/organizations/members')}
              >
                取消
              </Button>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {inviteMemberMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {inviteMemberMutation.error instanceof Error 
                    ? inviteMemberMutation.error.message 
                    : '邀請發送失敗，請稍後重試'}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">邀請流程說明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium">發送邀請郵件</h4>
              <p className="text-sm text-muted-foreground">
                系統將向指定郵箱發送包含魔法連結的邀請郵件
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium">接受邀請</h4>
              <p className="text-sm text-muted-foreground">
                被邀請者點擊郵件中的連結完成帳號設置和組織加入
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium">開始協作</h4>
              <p className="text-sm text-muted-foreground">
                成員將獲得相應角色權限並可訪問指定團隊功能
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}