/**
 * Integration Test: Organization User Creation Flow
 * 
 * Tests the complete end-to-end flow for creating organization users across all roles.
 * These tests MUST fail until the organization user creation flow is properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { POST as CreateUserHandler } from '@/app/api/admin/users/create/route';
import { prisma } from '@/lib/db';
import { CreateUserForm } from '@/components/forms/create-user-form';
import { type RoleType } from '@/types/role-sections';

// Mock the authentication for system admin
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => ({
    user: { id: 'admin123', role: 'admin' },
    session: { id: 'session123' }
  }))
}));

// Mock the email service
const mockSendMagicLinkEmail = vi.fn();
vi.mock('@/lib/email', () => ({
  sendMagicLinkEmail: mockSendMagicLinkEmail.mockResolvedValue({ success: true })
}));

// Mock toast notifications
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('Organization User Creation Integration Flow', () => {
  const user = userEvent.setup();
  let testOrganization: { id: string; name: string; slug: string };

  beforeEach(async () => {
    // Clean up test data
    await prisma.member.deleteMany({
      where: { 
        user: { email: { contains: 'test-org-user' } }
      }
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'test-org-user' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-org-user' } }
    });
    await prisma.organization.deleteMany({
      where: { name: { contains: 'Test Organization' } }
    });

    // Create test organization
    testOrganization = await prisma.organization.create({
      data: {
        name: 'Test Organization for Users',
        slug: 'test-org-users'
      }
    });

    // Reset mocks
    mockSendMagicLinkEmail.mockClear();
    mockToast.mockClear();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.member.deleteMany({
      where: { 
        user: { email: { contains: 'test-org-user' } }
      }
    });
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'test-org-user' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-org-user' } }
    });
    
    if (testOrganization) {
      await prisma.organization.delete({
        where: { id: testOrganization.id }
      });
    }
  });

  describe('Organization Owner Creation Flow', () => {
    it('creates organization owner from form submission to member relationship', async () => {
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Step 1: Select organization section
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      // Step 2: Select organization owner role
      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Step 3: Select organization
      const organizationSelect = screen.getByRole('combobox', { name: /organization/i });
      await user.click(organizationSelect);
      
      const orgOption = screen.getByText('Test Organization for Users');
      await user.click(orgOption);

      // Step 4: Fill in user details
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'test-org-user-owner@example.com');
      await user.type(nameInput, 'Test Organization Owner');

      // Step 5: Submit the form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Step 6: Wait for form submission to complete
      await waitFor(async () => {
        // Verify user was created in database
        const createdUser = await prisma.user.findUnique({
          where: { email: 'test-org-user-owner@example.com' },
          include: { memberships: true }
        });

        expect(createdUser).toBeTruthy();
        expect(createdUser?.name).toBe('Test Organization Owner');
        expect(createdUser?.role).toBe('member'); // Regular user role
        
        // Verify membership was created
        expect(createdUser?.memberships).toHaveLength(1);
        expect(createdUser?.memberships[0].organizationId).toBe(testOrganization.id);
        expect(createdUser?.memberships[0].role).toBe('owner');
      });

      // Step 7: Verify invitation was created
      const invitation = await prisma.invitation.findFirst({
        where: { email: 'test-org-user-owner@example.com' }
      });

      expect(invitation).toBeTruthy();
      expect(invitation?.organizationId).toBe(testOrganization.id);

      // Step 8: Verify role-specific success message
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Organization Owner Created!',
        description: expect.stringContaining('Test Organization Owner has been assigned as an owner of Test Organization for Users')
      });
    });

    it('validates organization requirement for owner role', async () => {
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Select organization owner without selecting organization
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Fill user details but skip organization
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'test-org-user-no-org@example.com');
      await user.type(nameInput, 'Test User Without Org');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/organization is required for this role/i)).toBeInTheDocument();
      });

      // Verify no user was created
      const createdUser = await prisma.user.findUnique({
        where: { email: 'test-org-user-no-org@example.com' }
      });
      expect(createdUser).toBeNull();
    });
  });

  describe('All Organization Roles Creation Flow', () => {
    const organizationRoles: Array<{
      roleType: RoleType;
      memberRole: string;
      displayName: string;
      titlePattern: string;
    }> = [
      {
        roleType: 'organization_owner',
        memberRole: 'owner',
        displayName: 'Organization Owner',
        titlePattern: 'Organization Owner Created!'
      },
      {
        roleType: 'organization_admin',
        memberRole: 'admin',
        displayName: 'Organization Admin',
        titlePattern: 'Organization Admin Created!'
      },
      {
        roleType: 'game_master',
        memberRole: 'gm',
        displayName: 'Game Master',
        titlePattern: 'Game Master Created!'
      },
      {
        roleType: 'game_staff',
        memberRole: 'staff',
        displayName: 'Game Staff',
        titlePattern: 'Game Staff Created!'
      },
      {
        roleType: 'game_player',
        memberRole: 'player',
        displayName: 'Game Player',
        titlePattern: 'Game Player Created!'
      }
    ];

    organizationRoles.forEach(({ roleType, memberRole, displayName, titlePattern }) => {
      it(`creates ${displayName.toLowerCase()} successfully`, async () => {
        await testApiHandler({
          appHandler: CreateUserHandler,
          test: async ({ fetch }) => {
            const response = await fetch({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: `test-org-user-${memberRole}@example.com`,
                name: `Test ${displayName}`,
                roleType,
                organizationId: testOrganization.id
              })
            });

            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);

            // Verify user creation
            const user = await prisma.user.findUnique({
              where: { email: `test-org-user-${memberRole}@example.com` },
              include: { memberships: true }
            });

            expect(user).toBeTruthy();
            expect(user?.name).toBe(`Test ${displayName}`);
            expect(user?.memberships).toHaveLength(1);
            expect(user?.memberships[0].role).toBe(memberRole);
            expect(user?.memberships[0].organizationId).toBe(testOrganization.id);

            // Verify invitation
            const invitation = await prisma.invitation.findFirst({
              where: { email: `test-org-user-${memberRole}@example.com` }
            });

            expect(invitation).toBeTruthy();
            expect(invitation?.organizationId).toBe(testOrganization.id);

            // Verify email was sent
            expect(mockSendMagicLinkEmail).toHaveBeenCalledWith({
              to: `test-org-user-${memberRole}@example.com`,
              userName: `Test ${displayName}`,
              magicLink: expect.stringContaining('/api/auth/magic-link/verify'),
              isNewUser: true,
              roleType,
              organizationName: 'Test Organization for Users'
            });
          }
        });
      });
    });
  });

  describe('Organization Selection Integration', () => {
    let additionalOrganizations: Array<{ id: string; name: string; slug: string }>;

    beforeEach(async () => {
      // Create additional organizations for selection testing
      additionalOrganizations = await Promise.all([
        prisma.organization.create({
          data: { name: 'Test Organization Alpha', slug: 'test-org-alpha' }
        }),
        prisma.organization.create({
          data: { name: 'Test Organization Beta', slug: 'test-org-beta' }
        }),
        prisma.organization.create({
          data: { name: 'Test Organization Gamma', slug: 'test-org-gamma' }
        })
      ]);
    });

    afterEach(async () => {
      if (additionalOrganizations) {
        await Promise.all(
          additionalOrganizations.map(org => 
            prisma.organization.delete({ where: { id: org.id } })
          )
        );
      }
    });

    it('displays all available organizations in selection', async () => {
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Select organization role to trigger organization selector
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Open organization selector
      const organizationSelect = screen.getByRole('combobox', { name: /organization/i });
      await user.click(organizationSelect);

      // Verify all organizations are available
      expect(screen.getByText('Test Organization for Users')).toBeInTheDocument();
      expect(screen.getByText('Test Organization Alpha')).toBeInTheDocument();
      expect(screen.getByText('Test Organization Beta')).toBeInTheDocument();
      expect(screen.getByText('Test Organization Gamma')).toBeInTheDocument();
    });

    it('creates user with selected organization correctly', async () => {
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const gameMasterRole = screen.getByLabelText(/game master/i);
      await user.click(gameMasterRole);

      // Select specific organization
      const organizationSelect = screen.getByRole('combobox', { name: /organization/i });
      await user.click(organizationSelect);
      
      const betaOrg = screen.getByText('Test Organization Beta');
      await user.click(betaOrg);

      // Fill form and submit
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'test-org-user-beta@example.com');
      await user.type(nameInput, 'Test Beta Game Master');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify correct organization assignment
      await waitFor(async () => {
        const user = await prisma.user.findUnique({
          where: { email: 'test-org-user-beta@example.com' },
          include: { memberships: true }
        });

        expect(user?.memberships[0].organizationId).toBe(additionalOrganizations[1].id);
      });
    });
  });

  describe('Form State Management Integration', () => {
    it('maintains form state during role switching within organization section', async () => {
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Fill in user details first
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'test-org-user-state@example.com');
      await user.type(nameInput, 'Test State Management User');

      // Select organization section and organization
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const organizationSelect = screen.getByRole('combobox', { name: /organization/i });
      await user.click(organizationSelect);
      
      const orgOption = screen.getByText('Test Organization for Users');
      await user.click(orgOption);

      // Switch between different organization roles
      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      const gameMasterRole = screen.getByLabelText(/game master/i);
      await user.click(gameMasterRole);

      const staffRole = screen.getByLabelText(/game staff/i);
      await user.click(staffRole);

      // Verify form still has the user details and organization
      expect(emailInput).toHaveValue('test-org-user-state@example.com');
      expect(nameInput).toHaveValue('Test State Management User');
      expect(screen.getByDisplayValue('Test Organization for Users')).toBeInTheDocument();
    });

    it('clears organization when switching from organization to system section', async () => {
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Start with organization section
      const organizationSection = screen.getByLabelText(/organization roles/i);
      await user.click(organizationSection);

      const ownerRole = screen.getByLabelText(/organization owner/i);
      await user.click(ownerRole);

      // Select organization
      const organizationSelect = screen.getByRole('combobox', { name: /organization/i });
      await user.click(organizationSelect);
      
      const orgOption = screen.getByText('Test Organization for Users');
      await user.click(orgOption);

      // Verify organization is selected
      expect(screen.getByDisplayValue('Test Organization for Users')).toBeInTheDocument();

      // Switch to system section
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      // Verify organization selector is no longer visible
      expect(screen.queryByDisplayValue('Test Organization for Users')).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: /organization/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles non-existent organization gracefully', async () => {
      await testApiHandler({
        appHandler: CreateUserHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-org-user-missing@example.com',
              name: 'Test Missing Org User',
              roleType: 'organization_owner',
              organizationId: 'non-existent-org-id'
            })
          });

          expect(response.status).toBe(404);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('Organization not found');

          // Verify no user was created
          const user = await prisma.user.findUnique({
            where: { email: 'test-org-user-missing@example.com' }
          });
          expect(user).toBeNull();
        }
      });
    });

    it('handles duplicate user creation gracefully', async () => {
      // Create initial user
      await prisma.user.create({
        data: {
          email: 'duplicate-org-user@example.com',
          name: 'Original User'
        }
      });

      await testApiHandler({
        appHandler: CreateUserHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'duplicate-org-user@example.com',
              name: 'Duplicate Organization User',
              roleType: 'organization_owner',
              organizationId: testOrganization.id
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('already exists');

          // Verify no membership was created
          const memberships = await prisma.member.findMany({
            where: { 
              user: { email: 'duplicate-org-user@example.com' }
            }
          });
          expect(memberships).toHaveLength(0);
        }
      });
    });

    it('handles email service failures during organization user creation', async () => {
      mockSendMagicLinkEmail.mockRejectedValueOnce(new Error('Email service down'));

      await testApiHandler({
        appHandler: CreateUserHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-org-user-email-fail@example.com',
              name: 'Test Email Fail User',
              roleType: 'game_master',
              organizationId: testOrganization.id
            })
          });

          expect(response.status).toBe(500);

          // Verify user and membership were still created
          const user = await prisma.user.findUnique({
            where: { email: 'test-org-user-email-fail@example.com' },
            include: { memberships: true }
          });

          expect(user).toBeTruthy();
          expect(user?.memberships).toHaveLength(1);
          expect(user?.memberships[0].organizationId).toBe(testOrganization.id);

          // Verify invitation marked as failed
          const invitation = await prisma.invitation.findFirst({
            where: { email: 'test-org-user-email-fail@example.com' }
          });
          expect(invitation?.status).toBe('failed');
        }
      });
    });
  });

  describe('Performance and Concurrent Operations', () => {
    it('handles concurrent organization user creation', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => 
        testApiHandler({
          appHandler: CreateUserHandler,
          test: async ({ fetch }) => {
            return fetch({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: `concurrent-org-user-${i}@example.com`,
                name: `Concurrent User ${i}`,
                roleType: 'game_player',
                organizationId: testOrganization.id
              })
            });
          }
        })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all users and memberships were created
      const users = await prisma.user.findMany({
        where: { email: { startsWith: 'concurrent-org-user-' } },
        include: { memberships: true }
      });

      expect(users).toHaveLength(3);
      users.forEach(user => {
        expect(user.memberships).toHaveLength(1);
        expect(user.memberships[0].organizationId).toBe(testOrganization.id);
        expect(user.memberships[0].role).toBe('player');
      });
    });

    it('completes organization user creation within acceptable time', async () => {
      await testApiHandler({
        appHandler: CreateUserHandler,
        test: async ({ fetch }) => {
          const startTime = performance.now();

          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'performance-org-user@example.com',
              name: 'Performance Test User',
              roleType: 'organization_admin',
              organizationId: testOrganization.id
            })
          });

          const endTime = performance.now();
          const duration = endTime - startTime;

          expect(response.status).toBe(201);
          expect(duration).toBeLessThan(3000); // <3 seconds for complete org user flow
        }
      });
    });
  });
});