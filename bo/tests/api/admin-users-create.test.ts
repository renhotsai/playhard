/**
 * API Contract Test: POST /api/admin/users/create
 * 
 * Tests the enhanced admin user creation endpoint with role sections support.
 * These tests MUST fail until the API endpoint is properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import { POST } from '@/app/api/admin/users/create/route';
import { prisma } from '@/lib/db';

// Mock the authentication
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => ({
    user: { id: 'admin123', role: 'admin' },
    session: { id: 'session123' }
  }))
}));

// Mock the email service
vi.mock('@/lib/email', () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue({ success: true })
}));

describe('POST /api/admin/users/create - Role Sections Contract', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.member.deleteMany({
      where: { 
        user: { email: { contains: 'test' } }
      }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.invitation.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.member.deleteMany({
      where: { 
        user: { email: { contains: 'test' } }
      }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  describe('System Admin Role Creation', () => {
    it('creates system admin user successfully', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-admin@example.com',
              name: 'Test System Admin',
              roleType: 'system_admin'
            })
          });

          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.success).toBe(true);
          expect(data.user).toMatchObject({
            email: 'test-admin@example.com',
            name: 'Test System Admin'
          });
          expect(data.invitation).toMatchObject({
            status: 'sent'
          });
        }
      });
    });

    it('assigns system admin role correctly', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-admin2@example.com',
              name: 'Test System Admin 2',
              roleType: 'system_admin'
            })
          });

          const user = await prisma.user.findUnique({
            where: { email: 'test-admin2@example.com' }
          });

          expect(user).toBeTruthy();
          expect(user?.role).toBe('admin');
        }
      });
    });

    it('does not require organization for system admin', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-admin3@example.com',
              name: 'Test System Admin 3',
              roleType: 'system_admin'
              // No organizationId provided
            })
          });

          expect(response.status).toBe(201);
          
          const data = await response.json();
          expect(data.success).toBe(true);
        }
      });
    });
  });

  describe('Organization Role Creation', () => {
    let testOrganization: { id: string };

    beforeEach(async () => {
      testOrganization = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org'
        }
      });
    });

    afterEach(async () => {
      if (testOrganization) {
        await prisma.organization.delete({
          where: { id: testOrganization.id }
        });
      }
    });

    it('creates organization owner successfully', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-owner@example.com',
              name: 'Test Organization Owner',
              roleType: 'organization_owner',
              organizationId: testOrganization.id
            })
          });

          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.success).toBe(true);
          expect(data.user).toMatchObject({
            email: 'test-owner@example.com',
            name: 'Test Organization Owner'
          });
        }
      });
    });

    it('creates organization admin successfully', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-org-admin@example.com',
              name: 'Test Organization Admin',
              roleType: 'organization_admin',
              organizationId: testOrganization.id
            })
          });

          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.success).toBe(true);
        }
      });
    });

    it('creates game master successfully', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-gm@example.com',
              name: 'Test Game Master',
              roleType: 'game_master',
              organizationId: testOrganization.id
            })
          });

          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.success).toBe(true);
        }
      });
    });

    it('creates game staff successfully', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-staff@example.com',
              name: 'Test Game Staff',
              roleType: 'game_staff',
              organizationId: testOrganization.id
            })
          });

          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.success).toBe(true);
        }
      });
    });

    it('creates game player successfully', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-player@example.com',
              name: 'Test Game Player',
              roleType: 'game_player',
              organizationId: testOrganization.id
            })
          });

          const data = await response.json();

          expect(response.status).toBe(201);
          expect(data.success).toBe(true);
        }
      });
    });

    it('creates member relationship correctly', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test-member@example.com',
              name: 'Test Member',
              roleType: 'organization_owner',
              organizationId: testOrganization.id
            })
          });

          const user = await prisma.user.findUnique({
            where: { email: 'test-member@example.com' },
            include: { memberships: true }
          });

          expect(user).toBeTruthy();
          expect(user?.memberships).toHaveLength(1);
          expect(user?.memberships[0].organizationId).toBe(testOrganization.id);
          expect(user?.memberships[0].role).toBe('owner');
        }
      });
    });
  });

  describe('Validation Requirements', () => {
    it('requires email field', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Test User',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('email');
        }
      });
    });

    it('requires name field', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('name');
        }
      });
    });

    it('requires roleType field', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              name: 'Test User'
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('role');
        }
      });
    });

    it('validates email format', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'invalid-email',
              name: 'Test User',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('email');
        }
      });
    });

    it('requires organizationId for organization roles', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              name: 'Test User',
              roleType: 'organization_owner'
              // Missing organizationId
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('organization');
        }
      });
    });

    it('validates roleType values', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              name: 'Test User',
              roleType: 'invalid_role'
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('role');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('handles duplicate email error', async () => {
      // Create initial user
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          name: 'Initial User'
        }
      });

      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'duplicate@example.com',
              name: 'Duplicate User',
              roleType: 'system_admin'
            })
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('already exists');
        }
      });
    });

    it('handles non-existent organization error', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              name: 'Test User',
              roleType: 'organization_owner',
              organizationId: 'non-existent-id'
            })
          });

          expect(response.status).toBe(404);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('Organization not found');
        }
      });
    });
  });

  describe('Authentication & Authorization', () => {
    it('requires authentication', async () => {
      // Mock unauthenticated request
      vi.mocked(require('@/lib/auth').auth).mockReturnValueOnce(null);

      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              name: 'Test User',
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

    it('requires system admin role', async () => {
      // Mock non-admin user
      vi.mocked(require('@/lib/auth').auth).mockReturnValueOnce({
        user: { id: 'user123', role: 'member' },
        session: { id: 'session123' }
      });

      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              name: 'Test User',
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

  describe('Response Format Contract', () => {
    it('returns correct success response format', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'format-test@example.com',
              name: 'Format Test User',
              roleType: 'system_admin'
            })
          });

          const data = await response.json();

          expect(data).toMatchObject({
            success: true,
            user: {
              id: expect.any(String),
              email: 'format-test@example.com',
              name: 'Format Test User'
            },
            invitation: {
              id: expect.any(String),
              status: expect.any(String),
              expiresAt: expect.any(String)
            }
          });
        }
      });
    });

    it('returns correct error response format', async () => {
      await testApiHandler({
        appHandler: POST,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'invalid-email',
              name: 'Test User',
              roleType: 'system_admin'
            })
          });

          const data = await response.json();

          expect(data).toMatchObject({
            success: false,
            error: {
              message: expect.any(String),
              field: expect.any(String)
            }
          });
        }
      });
    });
  });
});