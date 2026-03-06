/**
 * Integration Test: System Admin Creation Flow
 * 
 * Tests the complete end-to-end flow for creating system administrators.
 * These tests MUST fail until the system admin creation flow is properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { POST as CreateAdminHandler } from '@/app/api/create-admin/route';
import { prisma } from '@/lib/db';
import { CreateUserForm } from '@/components/forms/create-user-form';

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

describe('System Admin Creation Integration Flow', () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    // Clean up test data
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'test-admin' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-admin' } }
    });

    // Reset mocks
    mockSendMagicLinkEmail.mockClear();
    mockToast.mockClear();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'test-admin' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-admin' } }
    });
  });

  describe('Complete System Admin Creation Flow', () => {
    it('creates system admin from form submission to email delivery', async () => {
      // Step 1: Render the create user form
      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Step 2: Select system admin role section
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      // Step 3: Select system administrator role
      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      // Step 4: Fill in admin details
      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'test-admin@example.com');
      await user.type(nameInput, 'Test System Administrator');

      // Step 5: Submit the form
      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Step 6: Wait for form submission to complete
      await waitFor(async () => {
        // Verify user was created in database
        const createdUser = await prisma.user.findUnique({
          where: { email: 'test-admin@example.com' }
        });

        expect(createdUser).toBeTruthy();
        expect(createdUser?.name).toBe('Test System Administrator');
        expect(createdUser?.role).toBe('admin');
      });

      // Step 7: Verify invitation was created
      const invitation = await prisma.invitation.findFirst({
        where: { email: 'test-admin@example.com' }
      });

      expect(invitation).toBeTruthy();
      expect(invitation?.status).toBe('pending');
      expect(invitation?.expiresAt).toBeInstanceOf(Date);

      // Step 8: Verify magic link email was sent
      expect(mockSendMagicLinkEmail).toHaveBeenCalledWith({
        to: 'test-admin@example.com',
        userName: 'Test System Administrator',
        magicLink: expect.stringContaining('/api/auth/magic-link/verify'),
        isNewUser: true,
        roleType: 'system_admin'
      });

      // Step 9: Verify success notification
      expect(mockToast).toHaveBeenCalledWith({
        title: 'System Administrator Created!',
        description: expect.stringContaining('Test System Administrator has been granted full system administrator access')
      });
    });

    it('handles system admin creation with existing email gracefully', async () => {
      // Pre-create a user with the same email
      await prisma.user.create({
        data: {
          email: 'existing-admin@example.com',
          name: 'Existing User',
          role: 'member'
        }
      });

      render(
        <TestWrapper>
          <CreateUserForm />
        </TestWrapper>
      );

      // Select system admin and fill form
      const systemSection = screen.getByLabelText(/system roles/i);
      await user.click(systemSection);

      const systemAdminRole = screen.getByLabelText(/system administrator/i);
      await user.click(systemAdminRole);

      const emailInput = screen.getByLabelText(/email/i);
      const nameInput = screen.getByLabelText(/name/i);

      await user.type(emailInput, 'existing-admin@example.com');
      await user.type(nameInput, 'Duplicate System Admin');

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/user with this email already exists/i)).toBeInTheDocument();
      });

      // Verify no duplicate user was created
      const users = await prisma.user.findMany({
        where: { email: 'existing-admin@example.com' }
      });
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Existing User'); // Original user unchanged
    });
  });

  describe('API Endpoint Integration', () => {
    it('validates system admin creation API contract', async () => {
      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'api-test-admin@example.com',
              name: 'API Test Administrator',
              roleType: 'system_admin'
            })
          });

          const data = await response.json();

          // Verify API response
          expect(response.status).toBe(201);
          expect(data).toMatchObject({
            success: true,
            user: {
              id: expect.any(String),
              email: 'api-test-admin@example.com',
              name: 'API Test Administrator',
              role: 'admin'
            },
            invitation: {
              id: expect.any(String),
              status: 'pending',
              expiresAt: expect.any(String)
            }
          });

          // Verify database state
          const user = await prisma.user.findUnique({
            where: { email: 'api-test-admin@example.com' }
          });

          expect(user).toBeTruthy();
          expect(user?.role).toBe('admin');
        }
      });
    });

    it('validates API authentication requirements', async () => {
      // Mock unauthenticated request
      vi.mocked(require('@/lib/auth').auth).mockReturnValueOnce(null);

      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'unauthorized-admin@example.com',
              name: 'Unauthorized Admin',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(401);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('Authentication required');
        }
      });
    });

    it('validates API authorization requirements', async () => {
      // Mock non-admin user
      vi.mocked(require('@/lib/auth').auth).mockReturnValueOnce({
        user: { id: 'user123', role: 'member' },
        session: { id: 'session123' }
      });

      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'forbidden-admin@example.com',
              name: 'Forbidden Admin',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(403);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('System administrator access required');
        }
      });
    });
  });

  describe('Email Integration Flow', () => {
    it('sends properly formatted magic link email for system admin', async () => {
      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'email-test-admin@example.com',
              name: 'Email Test Administrator',
              roleType: 'system_admin'
            })
          });

          // Verify email was sent with correct parameters
          expect(mockSendMagicLinkEmail).toHaveBeenCalledWith({
            to: 'email-test-admin@example.com',
            userName: 'Email Test Administrator',
            magicLink: expect.stringMatching(/^http:\/\/localhost:3000\/api\/auth\/magic-link\/verify\?token=.+/),
            isNewUser: true,
            roleType: 'system_admin'
          });

          // Verify magic link contains proper token
          const emailCall = mockSendMagicLinkEmail.mock.calls[0][0];
          const url = new URL(emailCall.magicLink);
          const token = url.searchParams.get('token');
          
          expect(token).toBeTruthy();
          expect(token).toMatch(/^[a-zA-Z0-9]+$/); // Valid token format
        }
      });
    });

    it('handles email service failures gracefully', async () => {
      // Mock email service failure
      mockSendMagicLinkEmail.mockRejectedValueOnce(new Error('Email service unavailable'));

      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'email-fail-admin@example.com',
              name: 'Email Fail Administrator',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(500);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('Failed to send invitation email');

          // Verify user was still created but invitation marked as failed
          const user = await prisma.user.findUnique({
            where: { email: 'email-fail-admin@example.com' }
          });
          
          expect(user).toBeTruthy();
          
          const invitation = await prisma.invitation.findFirst({
            where: { email: 'email-fail-admin@example.com' }
          });
          
          expect(invitation?.status).toBe('failed');
        }
      });
    });
  });

  describe('Database Transaction Integrity', () => {
    it('maintains data consistency during system admin creation', async () => {
      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'consistency-admin@example.com',
              name: 'Consistency Test Administrator',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(201);

          // Verify all related records are created consistently
          const user = await prisma.user.findUnique({
            where: { email: 'consistency-admin@example.com' },
            include: {
              invitations: true
            }
          });

          expect(user).toBeTruthy();
          expect(user?.role).toBe('admin');
          expect(user?.invitations).toHaveLength(1);
          expect(user?.invitations[0].status).toBe('pending');
          
          // Verify timestamps are consistent
          const timeDiff = Math.abs(
            user!.createdAt.getTime() - user!.invitations[0].createdAt.getTime()
          );
          expect(timeDiff).toBeLessThan(1000); // Created within 1 second
        }
      });
    });

    it('rolls back on database constraint violations', async () => {
      // Create user with constraint that will be violated
      await prisma.user.create({
        data: {
          email: 'constraint-admin@example.com',
          name: 'Original User'
        }
      });

      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'constraint-admin@example.com', // Duplicate email
              name: 'Constraint Test Administrator',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(400);

          // Verify no partial data was created
          const users = await prisma.user.findMany({
            where: { email: 'constraint-admin@example.com' }
          });
          
          expect(users).toHaveLength(1);
          expect(users[0].name).toBe('Original User'); // Original unchanged

          const invitations = await prisma.invitation.findMany({
            where: { email: 'constraint-admin@example.com' }
          });
          
          expect(invitations).toHaveLength(0); // No invitation created
        }
      });
    });
  });

  describe('Security Validation', () => {
    it('prevents SQL injection in admin creation', async () => {
      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: "malicious'; DROP TABLE users; --@example.com",
              name: "'; DELETE FROM users; --",
              roleType: 'system_admin'
            })
          });

          // Should fail validation, not cause SQL injection
          expect(response.status).toBe(400);
          
          // Verify users table still exists and has data
          const userCount = await prisma.user.count();
          expect(userCount).toBeGreaterThanOrEqual(0); // Table exists
        }
      });
    });

    it('validates input sanitization', async () => {
      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'xss-admin@example.com',
              name: '<script>alert("xss")</script>Admin',
              roleType: 'system_admin'
            })
          });

          if (response.status === 201) {
            const user = await prisma.user.findUnique({
              where: { email: 'xss-admin@example.com' }
            });

            // Verify script tags are escaped or removed
            expect(user?.name).not.toContain('<script>');
            expect(user?.name).not.toContain('alert(');
          }
        }
      });
    });
  });

  describe('Performance Requirements', () => {
    it('completes system admin creation within acceptable time', async () => {
      await testApiHandler({
        appHandler: CreateAdminHandler,
        test: async ({ fetch }) => {
          const startTime = performance.now();

          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'performance-admin@example.com',
              name: 'Performance Test Administrator',
              roleType: 'system_admin'
            })
          });

          const endTime = performance.now();
          const duration = endTime - startTime;

          expect(response.status).toBe(201);
          expect(duration).toBeLessThan(2000); // <2 seconds for complete flow
        }
      });
    });

    it('handles concurrent admin creation requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        testApiHandler({
          appHandler: CreateAdminHandler,
          test: async ({ fetch }) => {
            return fetch({
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: `concurrent-admin-${i}@example.com`,
                name: `Concurrent Admin ${i}`,
                roleType: 'system_admin'
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

      // Verify all users were created
      const users = await prisma.user.findMany({
        where: {
          email: { startsWith: 'concurrent-admin-' }
        }
      });

      expect(users).toHaveLength(5);
    });
  });
});