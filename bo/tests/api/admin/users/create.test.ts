/**
 * T005 - Contract Test: POST /api/admin/users/create
 * 
 * Tests the API contract for creating users with murder mystery roles.
 * This test MUST FAIL initially as the endpoint doesn't exist yet (TDD).
 * 
 * Based on: specs/003-implement-admin-create/contracts/admin-create-user-api.yaml
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Types from our murder mystery role system
type UserType = 'system_admin' | 'organization_user';
type OrganizationRole = 'owner' | 'admin' | 'gm' | 'staff' | 'player';

interface CreateUserRequest {
  email: string;
  name: string;
  userType: UserType;
  organizationId?: string;
  organizationRole?: OrganizationRole;
}

interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  invitation?: {
    id: string;
    status: 'sent' | 'pending' | 'accepted' | 'expired';
    expiresAt: string;
  };
  error?: {
    message: string;
    field?: string;
    code?: string;
  };
}

describe('POST /api/admin/users/create - Contract Tests', () => {
  const testOrganizationId = '550e8400-e29b-41d4-a716-446655440000';
  
  beforeEach(() => {
    // Reset any mocks or test state
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Success Cases (201)', () => {
    it('should create system administrator successfully', async () => {
      const payload: CreateUserRequest = {
        email: 'admin@example.com',
        name: 'System Administrator',
        userType: 'system_admin'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookie
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(payload.email);
      expect(data.user?.name).toBe(payload.name);
      expect(data.user?.id).toMatch(/^usr_/); // Expected ID format
      expect(data.invitation).toBeDefined();
      expect(data.invitation?.status).toBe('sent');
      expect(data.invitation?.id).toMatch(/^inv_/); // Expected invitation ID format
    });

    it('should create organization owner successfully', async () => {
      const payload: CreateUserRequest = {
        email: 'owner@example.com',
        name: 'Organization Owner',
        userType: 'organization_user',
        organizationId: testOrganizationId,
        organizationRole: 'owner'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(payload.email);
      expect(data.invitation).toBeDefined();
    });

    it('should create Game Master (GM) successfully', async () => {
      const payload: CreateUserRequest = {
        email: 'gamemaster@example.com',
        name: 'Game Master',
        userType: 'organization_user',
        organizationId: testOrganizationId,
        organizationRole: 'gm'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.invitation).toBeDefined();
    });

    it('should create Game Staff successfully', async () => {
      const payload: CreateUserRequest = {
        email: 'staff@example.com',
        name: 'Game Staff Member',
        userType: 'organization_user',
        organizationId: testOrganizationId,
        organizationRole: 'staff'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.invitation).toBeDefined();
    });

    it('should create Game Player successfully', async () => {
      const payload: CreateUserRequest = {
        email: 'player@example.com',
        name: 'Game Player',
        userType: 'organization_user',
        organizationId: testOrganizationId,
        organizationRole: 'player'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.invitation).toBeDefined();
    });
  });

  describe('Validation Errors (400)', () => {
    it('should reject invalid email format', async () => {
      const payload = {
        email: 'invalid-email',
        name: 'Test User',
        userType: 'system_admin'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error?.message).toContain('email');
      expect(data.error?.field).toBe('email');
    });

    it('should reject missing organization data for organization users', async () => {
      const payload = {
        email: 'user@example.com',
        name: 'Test User',
        userType: 'organization_user'
        // Missing organizationId and organizationRole
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should reject invalid organization role', async () => {
      const payload = {
        email: 'user@example.com',
        name: 'Test User',
        userType: 'organization_user',
        organizationId: testOrganizationId,
        organizationRole: 'invalid_role'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error?.field).toBe('organizationRole');
    });

    it('should reject duplicate email', async () => {
      const payload: CreateUserRequest = {
        email: 'existing@example.com',
        name: 'Test User',
        userType: 'system_admin'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error?.message).toContain('email already exists');
      expect(data.error?.field).toBe('email');
    });
  });

  describe('Authentication & Authorization Errors', () => {
    it('should return 401 when not authenticated', async () => {
      const payload: CreateUserRequest = {
        email: 'test@example.com',
        name: 'Test User',
        userType: 'system_admin'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // No credentials - unauthenticated request
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(401);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error?.message).toContain('Authentication required');
    });

    it('should return 403 when not a system admin', async () => {
      // This test assumes we have a way to mock non-admin session
      const payload: CreateUserRequest = {
        email: 'test@example.com',
        name: 'Test User',
        userType: 'system_admin'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mock header for non-admin user (would be handled by test setup)
          'X-Test-User-Role': 'member'
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(403);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error?.message).toContain('System administrator access required');
    });
  });

  describe('Resource Errors (404)', () => {
    it('should return 404 for non-existent organization', async () => {
      const payload: CreateUserRequest = {
        email: 'user@example.com',
        name: 'Test User',
        userType: 'organization_user',
        organizationId: '00000000-0000-0000-0000-000000000000', // Non-existent org
        organizationRole: 'owner'
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(404);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error?.message).toContain('Organization not found');
      expect(data.error?.field).toBe('organizationId');
    });
  });

  describe('Server Errors (500)', () => {
    it('should handle internal server errors gracefully', async () => {
      const payload: CreateUserRequest = {
        email: 'test@example.com',
        name: 'Test User',
        userType: 'system_admin'
      };

      // This test would require mocking a server error scenario
      // For now, we just verify the expected response format
      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Force-Error': 'true' // Mock header to force error
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 500) {
        const data: CreateUserResponse = await response.json();
        expect(data.success).toBe(false);
        expect(data.error?.message).toBeDefined();
      }
    });
  });

  describe('Request Validation', () => {
    it('should reject requests with missing required fields', async () => {
      const payload = {
        // Missing email, name, userType
      };

      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      
      const data: CreateUserResponse = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should reject requests with invalid content type', async () => {
      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        credentials: 'include',
        body: 'invalid data',
      });

      expect(response.status).toBe(400);
    });

    it('should reject non-POST requests', async () => {
      const response = await fetch('http://localhost:3000/api/admin/users/create', {
        method: 'GET',
        credentials: 'include',
      });

      expect(response.status).toBe(405); // Method Not Allowed
    });
  });
});