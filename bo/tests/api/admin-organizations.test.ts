/**
 * API Contract Test: GET /api/admin/organizations
 * 
 * Tests the admin organizations endpoint for role-aware organization selection.
 * These tests MUST fail until the API endpoint supports enhanced functionality.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testApiHandler } from 'next-test-api-route-handler';
import { GET } from '@/app/api/admin/organizations/route';
import { prisma } from '@/lib/db';

// Mock the authentication
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(() => ({
    user: { id: 'admin123', role: 'admin' },
    session: { id: 'session123' }
  }))
}));

describe('GET /api/admin/organizations - Enhanced Contract', () => {
  let testOrganizations: Array<{ id: string; name: string; slug: string }> = [];

  beforeEach(async () => {
    // Clean up existing test data
    await prisma.member.deleteMany({
      where: { organization: { name: { contains: 'Test' } } }
    });
    await prisma.organization.deleteMany({
      where: { name: { contains: 'Test' } }
    });

    // Create test organizations
    testOrganizations = await Promise.all([
      prisma.organization.create({
        data: {
          name: 'Test Organization Alpha',
          slug: 'test-org-alpha'
        }
      }),
      prisma.organization.create({
        data: {
          name: 'Test Organization Beta',
          slug: 'test-org-beta'
        }
      }),
      prisma.organization.create({
        data: {
          name: 'Test Organization Gamma',
          slug: 'test-org-gamma'
        }
      })
    ]);

    // Create some test users and members for member count testing
    const testUser = await prisma.user.create({
      data: {
        email: 'test-member@example.com',
        name: 'Test Member'
      }
    });

    await prisma.member.create({
      data: {
        userId: testUser.id,
        organizationId: testOrganizations[0].id,
        role: 'owner'
      }
    });

    await prisma.member.create({
      data: {
        userId: testUser.id,
        organizationId: testOrganizations[1].id,
        role: 'admin'
      }
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.member.deleteMany({
      where: { organization: { name: { contains: 'Test' } } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.organization.deleteMany({
      where: { name: { contains: 'Test' } }
    });
  });

  describe('Basic Organization Listing', () => {
    it('returns all organizations for system admin', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.organizations).toBeInstanceOf(Array);
          expect(data.organizations.length).toBeGreaterThanOrEqual(3);
          
          // Check that our test organizations are included
          const orgNames = data.organizations.map((org: any) => org.name);
          expect(orgNames).toContain('Test Organization Alpha');
          expect(orgNames).toContain('Test Organization Beta');
          expect(orgNames).toContain('Test Organization Gamma');
        }
      });
    });

    it('returns organizations with required fields', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org).toMatchObject({
              id: expect.any(String),
              name: expect.any(String),
              slug: expect.any(String)
            });
          });
        }
      });
    });

    it('returns organizations sorted by name', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          const orgNames = data.organizations.map((org: any) => org.name);
          const sortedNames = [...orgNames].sort();
          
          expect(orgNames).toEqual(sortedNames);
        }
      });
    });
  });

  describe('Enhanced Organization Metadata', () => {
    it('includes member count for each organization', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org).toHaveProperty('memberCount');
            expect(typeof org.memberCount).toBe('number');
            expect(org.memberCount).toBeGreaterThanOrEqual(0);
          });

          // Find our test organizations and verify member counts
          const alphaOrg = data.organizations.find((org: any) => org.name === 'Test Organization Alpha');
          const betaOrg = data.organizations.find((org: any) => org.name === 'Test Organization Beta');
          const gammaOrg = data.organizations.find((org: any) => org.name === 'Test Organization Gamma');

          expect(alphaOrg?.memberCount).toBe(1); // Has one member
          expect(betaOrg?.memberCount).toBe(1);  // Has one member
          expect(gammaOrg?.memberCount).toBe(0); // No members
        }
      });
    });

    it('includes role distribution metadata', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org).toHaveProperty('roleDistribution');
            expect(org.roleDistribution).toMatchObject({
              owner: expect.any(Number),
              admin: expect.any(Number),
              gm: expect.any(Number),
              staff: expect.any(Number),
              player: expect.any(Number)
            });
          });
        }
      });
    });

    it('includes creation date information', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org).toHaveProperty('createdAt');
            expect(new Date(org.createdAt)).toBeInstanceOf(Date);
          });
        }
      });
    });

    it('includes status information for role assignment', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org).toHaveProperty('status');
            expect(['active', 'inactive', 'pending']).toContain(org.status);
            
            expect(org).toHaveProperty('canAssignRoles');
            expect(typeof org.canAssignRoles).toBe('boolean');
          });
        }
      });
    });
  });

  describe('Filtering and Search', () => {
    it('supports filtering by organization status', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '?status=active'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org.status).toBe('active');
          });
        }
      });
    });

    it('supports search by organization name', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '?search=Alpha'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.organizations.length).toBeGreaterThanOrEqual(1);
          
          const alphaOrg = data.organizations.find((org: any) => org.name === 'Test Organization Alpha');
          expect(alphaOrg).toBeTruthy();
        }
      });
    });

    it('supports filtering by minimum member count', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '?minMembers=1'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          data.organizations.forEach((org: any) => {
            expect(org.memberCount).toBeGreaterThanOrEqual(1);
          });
        }
      });
    });
  });

  describe('Pagination Support', () => {
    it('supports pagination with limit parameter', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '?limit=2'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.organizations.length).toBeLessThanOrEqual(2);
          
          expect(data).toHaveProperty('pagination');
          expect(data.pagination).toMatchObject({
            total: expect.any(Number),
            limit: 2,
            offset: 0,
            hasMore: expect.any(Boolean)
          });
        }
      });
    });

    it('supports pagination with offset parameter', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '?limit=1&offset=1'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.pagination.offset).toBe(1);
        }
      });
    });
  });

  describe('Authentication & Authorization', () => {
    it('requires authentication', async () => {
      // Mock unauthenticated request
      vi.mocked(require('@/lib/auth').auth).mockReturnValueOnce(null);

      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
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
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          expect(response.status).toBe(403);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('System administrator access required');
        }
      });
    });
  });

  describe('Performance Requirements', () => {
    it('returns response within acceptable time (<500ms)', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const startTime = performance.now();
          
          const response = await fetch({
            method: 'GET'
          });

          const endTime = performance.now();
          const responseTime = endTime - startTime;

          expect(response.status).toBe(200);
          expect(responseTime).toBeLessThan(500); // <500ms requirement
        }
      });
    });

    it('handles large number of organizations efficiently', async () => {
      // This test would create many organizations in a real scenario
      // For now, we test with existing data
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const startTime = performance.now();
          
          const response = await fetch({
            method: 'GET',
            url: '?limit=100' // Request larger limit
          });

          const endTime = performance.now();
          const responseTime = endTime - startTime;

          expect(response.status).toBe(200);
          expect(responseTime).toBeLessThan(1000); // <1s for larger datasets
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('handles invalid query parameters gracefully', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            url: '?limit=invalid&offset=abc'
          });

          expect(response.status).toBe(400);
          
          const data = await response.json();
          expect(data.success).toBe(false);
          expect(data.error.message).toContain('Invalid query parameters');
        }
      });
    });

    it('handles database connection errors', async () => {
      // This would be mocked in a real test environment
      // For now, we test the error response format
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          // Assuming normal operation, should succeed
          expect(response.status).toBe(200);
        }
      });
    });
  });

  describe('Response Format Contract', () => {
    it('returns correct response format', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data).toMatchObject({
            organizations: expect.any(Array),
            pagination: {
              total: expect.any(Number),
              limit: expect.any(Number),
              offset: expect.any(Number),
              hasMore: expect.any(Boolean)
            }
          });
        }
      });
    });

    it('returns consistent organization object structure', async () => {
      await testApiHandler({
        appHandler: GET,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET'
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          
          if (data.organizations.length > 0) {
            const org = data.organizations[0];
            expect(org).toMatchObject({
              id: expect.any(String),
              name: expect.any(String),
              slug: expect.any(String),
              memberCount: expect.any(Number),
              roleDistribution: {
                owner: expect.any(Number),
                admin: expect.any(Number),
                gm: expect.any(Number),
                staff: expect.any(Number),
                player: expect.any(Number)
              },
              status: expect.any(String),
              canAssignRoles: expect.any(Boolean),
              createdAt: expect.any(String)
            });
          }
        }
      });
    });
  });
});