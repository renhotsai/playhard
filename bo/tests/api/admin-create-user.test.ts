/**
 * T004: Contract test POST /api/admin/users/create
 * 
 * This test validates the API contract for the admin user creation endpoint.
 * Tests request/response schemas, error handling, and authentication requirements.
 * 
 * CRITICAL: This test MUST FAIL initially (TDD RED phase)
 * Implementation comes after tests pass
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/users/create/route';

// Mock Better Auth session
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn()
    }
  }
}));

describe('POST /api/admin/users/create - API Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication Requirements', () => {
    it('should return 401 when no session exists', async () => {
      // Mock no session
      const { auth } = require('@/lib/auth');
      auth.api.getSession.mockResolvedValueOnce({ session: null, user: null });

      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          userType: 'system_admin'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Authentication required');
    });

    it('should return 403 when user is not system admin', async () => {
      // Mock non-admin session
      const { auth } = require('@/lib/auth');
      auth.api.getSession.mockResolvedValueOnce({
        session: { id: 'session1' },
        user: { id: 'user1', role: null } // Not system admin
      });

      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          userType: 'system_admin'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('System administrator access required');
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      // Mock admin session
      const { auth } = require('@/lib/auth');
      auth.api.getSession.mockResolvedValue({
        session: { id: 'session1' },
        user: { id: 'admin1', role: 'admin' }
      });
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('email');
    });

    it('should validate email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'Test User',
          userType: 'system_admin'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Invalid email format');
      expect(data.error.field).toBe('email');
    });

    it('should validate organization requirements for organization users', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'orguser@example.com',
          name: 'Org User',
          userType: 'organization_user'
          // Missing organizationId and organizationRole
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Organization and role required');
    });
  });

  describe('Success Response Contract', () => {
    beforeEach(() => {
      // Mock admin session
      const { auth } = require('@/lib/auth');
      auth.api.getSession.mockResolvedValue({
        session: { id: 'session1' },
        user: { id: 'admin1', role: 'admin' }
      });
    });

    it('should create system admin successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          name: 'System Administrator',
          userType: 'system_admin'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBe('admin@example.com');
      expect(data.user.name).toBe('System Administrator');
      expect(data.invitation).toBeDefined();
      expect(data.invitation.id).toBeDefined();
      expect(data.invitation.status).toBe('sent');
    });

    it('should create organization user successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@example.com',
          name: 'Organization Owner',
          userType: 'organization_user',
          organizationId: '550e8400-e29b-41d4-a716-446655440000',
          organizationRole: 'owner'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBe('owner@example.com');
      expect(data.user.name).toBe('Organization Owner');
      expect(data.invitation).toBeDefined();
      expect(data.invitation.id).toBeDefined();
      expect(data.invitation.status).toBe('sent');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock admin session
      const { auth } = require('@/lib/auth');
      auth.api.getSession.mockResolvedValue({
        session: { id: 'session1' },
        user: { id: 'admin1', role: 'admin' }
      });
    });

    it('should return 400 for duplicate email', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          name: 'Test User',
          userType: 'system_admin'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('User with this email already exists');
      expect(data.error.field).toBe('email');
    });

    it('should return 404 for non-existent organization', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@example.com',
          name: 'Test User',
          userType: 'organization_user',
          organizationId: 'non-existent-id',
          organizationRole: 'owner'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Organization not found');
      expect(data.error.field).toBe('organizationId');
    });

    it('should handle internal server errors gracefully', async () => {
      // This test will help ensure proper error handling structure
      // Implementation should catch and properly format any unexpected errors
      
      const request = new NextRequest('http://localhost:3000/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          userType: 'system_admin'
        })
      });

      const response = await POST(request);
      
      // Even if internal error occurs, response should be well-formed
      expect(response.status).toBeGreaterThanOrEqual(500);
      if (response.status >= 500) {
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
        expect(data.error.message).toBeDefined();
      }
    });
  });
});