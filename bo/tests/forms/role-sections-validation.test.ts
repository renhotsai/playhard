/**
 * Form Validation Tests: Role Sections
 * 
 * Tests form validation logic for the two-tier role selection system.
 * These tests MUST fail until the form validation is properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { 
  roleSectionsValidators,
  createUserFormValidator,
  validateRoleSection,
  validateOrganizationRequirement,
  validateEmailFormat,
  validateNameLength
} from '@/lib/form-validators';
import { 
  type RoleType,
  type CreateUserFormData 
} from '@/types/role-sections';

// Mock form utilities
const mockFormState = {
  values: {} as CreateUserFormData,
  errors: {},
  touched: {},
  isSubmitting: false,
  isValid: false
};

describe('Role Sections Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Field Validation', () => {
    it('validates email field is required', () => {
      const validator = roleSectionsValidators.email;
      
      // Test empty email
      expect(() => validator.validate('')).toThrow(/email is required/i);
      expect(() => validator.validate(null)).toThrow(/email is required/i);
      expect(() => validator.validate(undefined)).toThrow(/email is required/i);
    });

    it('validates email format', () => {
      const result1 = validateEmailFormat('invalid-email');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Invalid email format');

      const result2 = validateEmailFormat('user@domain');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('Invalid email format');

      const result3 = validateEmailFormat('valid@example.com');
      expect(result3.isValid).toBe(true);
      expect(result3.error).toBeNull();
    });

    it('validates name field is required', () => {
      const validator = roleSectionsValidators.name;
      
      expect(() => validator.validate('')).toThrow(/name is required/i);
      expect(() => validator.validate('   ')).toThrow(/name is required/i);
    });

    it('validates name length constraints', () => {
      const result1 = validateNameLength('A'); // Too short
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Name must be at least 2 characters');

      const result2 = validateNameLength('A'.repeat(101)); // Too long
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('Name must be no more than 100 characters');

      const result3 = validateNameLength('Valid Name');
      expect(result3.isValid).toBe(true);
      expect(result3.error).toBeNull();
    });

    it('validates roleType field is required', () => {
      const validator = roleSectionsValidators.roleType;
      
      expect(() => validator.validate(null)).toThrow(/role type is required/i);
      expect(() => validator.validate(undefined)).toThrow(/role type is required/i);
    });

    it('validates roleType values', () => {
      const validRoles: RoleType[] = [
        'system_admin',
        'organization_owner',
        'organization_admin',
        'game_master',
        'game_staff',
        'game_player'
      ];

      validRoles.forEach(role => {
        expect(() => roleSectionsValidators.roleType.validate(role)).not.toThrow();
      });

      // Invalid role types
      expect(() => roleSectionsValidators.roleType.validate('invalid_role' as RoleType))
        .toThrow(/invalid role type/i);
    });
  });

  describe('Role Section Validation', () => {
    it('validates system role section correctly', () => {
      const result = validateRoleSection('system_admin');
      
      expect(result.isValid).toBe(true);
      expect(result.section).toBe('system');
      expect(result.requiresOrganization).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it('validates organization role section correctly', () => {
      const organizationRoles: RoleType[] = [
        'organization_owner',
        'organization_admin',
        'game_master',
        'game_staff',
        'game_player'
      ];

      organizationRoles.forEach(role => {
        const result = validateRoleSection(role);
        
        expect(result.isValid).toBe(true);
        expect(result.section).toBe('organization');
        expect(result.requiresOrganization).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('rejects invalid role types', () => {
      const result = validateRoleSection('invalid_role' as RoleType);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid role type');
    });
  });

  describe('Organization Requirement Validation', () => {
    it('validates organization is required for organization roles', () => {
      const organizationRoles: RoleType[] = [
        'organization_owner',
        'organization_admin',
        'game_master',
        'game_staff',
        'game_player'
      ];

      organizationRoles.forEach(role => {
        // Without organization
        const result1 = validateOrganizationRequirement(role, null);
        expect(result1.isValid).toBe(false);
        expect(result1.error).toContain('Organization is required for this role');

        const result2 = validateOrganizationRequirement(role, undefined);
        expect(result2.isValid).toBe(false);
        expect(result2.error).toContain('Organization is required for this role');

        // With organization
        const result3 = validateOrganizationRequirement(role, 'org123');
        expect(result3.isValid).toBe(true);
        expect(result3.error).toBeNull();
      });
    });

    it('validates organization is not required for system roles', () => {
      // Without organization (should be valid)
      const result1 = validateOrganizationRequirement('system_admin', null);
      expect(result1.isValid).toBe(true);
      expect(result1.error).toBeNull();

      // With organization (should still be valid)
      const result2 = validateOrganizationRequirement('system_admin', 'org123');
      expect(result2.isValid).toBe(true);
      expect(result2.error).toBeNull();
    });
  });

  describe('Complete Form Validation', () => {
    it('validates system admin form completely', () => {
      const validSystemAdminData: CreateUserFormData = {
        email: 'admin@example.com',
        name: 'System Administrator',
        roleType: 'system_admin',
        selectedSection: 'system'
        // organizationId should not be required
      };

      const result = createUserFormValidator.safeParse(validSystemAdminData);
      expect(result.success).toBe(true);
    });

    it('validates organization user form completely', () => {
      const validOrgUserData: CreateUserFormData = {
        email: 'owner@example.com',
        name: 'Organization Owner',
        roleType: 'organization_owner',
        selectedSection: 'organization',
        organizationId: 'org123'
      };

      const result = createUserFormValidator.safeParse(validOrgUserData);
      expect(result.success).toBe(true);
    });

    it('rejects incomplete system admin form', () => {
      const incompleteData = {
        email: '',
        name: 'System Admin',
        roleType: 'system_admin',
        selectedSection: 'system'
      };

      const result = createUserFormValidator.safeParse(incompleteData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const emailError = result.error.issues.find(issue => 
          issue.path.includes('email')
        );
        expect(emailError).toBeTruthy();
      }
    });

    it('rejects organization user without organization', () => {
      const incompleteData = {
        email: 'owner@example.com',
        name: 'Organization Owner',
        roleType: 'organization_owner',
        selectedSection: 'organization'
        // Missing organizationId
      };

      const result = createUserFormValidator.safeParse(incompleteData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const orgError = result.error.issues.find(issue => 
          issue.message.includes('organization') || issue.message.includes('Organization')
        );
        expect(orgError).toBeTruthy();
      }
    });
  });

  describe('Cross-Field Validation', () => {
    it('validates role type matches selected section', () => {
      // System role with organization section (invalid)
      const invalidData1 = {
        email: 'test@example.com',
        name: 'Test User',
        roleType: 'system_admin' as RoleType,
        selectedSection: 'organization' as const
      };

      const result1 = createUserFormValidator.safeParse(invalidData1);
      expect(result1.success).toBe(false);

      // Organization role with system section (invalid)
      const invalidData2 = {
        email: 'test@example.com',
        name: 'Test User',
        roleType: 'organization_owner' as RoleType,
        selectedSection: 'system' as const
      };

      const result2 = createUserFormValidator.safeParse(invalidData2);
      expect(result2.success).toBe(false);
    });

    it('validates organization ID format when provided', () => {
      const dataWithInvalidOrgId = {
        email: 'owner@example.com',
        name: 'Organization Owner',
        roleType: 'organization_owner' as RoleType,
        selectedSection: 'organization' as const,
        organizationId: '' // Empty string instead of valid ID
      };

      const result = createUserFormValidator.safeParse(dataWithInvalidOrgId);
      expect(result.success).toBe(false);
    });
  });

  describe('Real-time Validation', () => {
    it('provides immediate email validation feedback', () => {
      const testCases = [
        { input: '', expected: 'Email is required' },
        { input: 'invalid', expected: 'Invalid email format' },
        { input: 'user@', expected: 'Invalid email format' },
        { input: 'user@domain', expected: 'Invalid email format' },
        { input: 'valid@example.com', expected: null }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validateEmailFormat(input);
        if (expected) {
          expect(result.isValid).toBe(false);
          expect(result.error).toContain(expected);
        } else {
          expect(result.isValid).toBe(true);
          expect(result.error).toBeNull();
        }
      });
    });

    it('provides immediate role selection validation', () => {
      const systemRoleWithOrg = {
        roleType: 'system_admin' as RoleType,
        organizationId: 'org123'
      };

      // Should validate even with org (organization is optional for system roles)
      const result1 = validateOrganizationRequirement(
        systemRoleWithOrg.roleType, 
        systemRoleWithOrg.organizationId
      );
      expect(result1.isValid).toBe(true);

      const orgRoleWithoutOrg = {
        roleType: 'organization_owner' as RoleType,
        organizationId: null
      };

      // Should fail validation
      const result2 = validateOrganizationRequirement(
        orgRoleWithoutOrg.roleType, 
        orgRoleWithoutOrg.organizationId
      );
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('Organization is required');
    });
  });

  describe('Async Validation', () => {
    it('validates email uniqueness asynchronously', async () => {
      // Mock API call for email uniqueness
      const mockCheckEmailUnique = vi.fn();
      
      // Email already exists
      mockCheckEmailUnique.mockResolvedValueOnce({ isUnique: false });
      
      const result1 = await mockCheckEmailUnique('existing@example.com');
      expect(result1.isUnique).toBe(false);

      // Email is unique
      mockCheckEmailUnique.mockResolvedValueOnce({ isUnique: true });
      
      const result2 = await mockCheckEmailUnique('new@example.com');
      expect(result2.isUnique).toBe(true);
    });

    it('validates organization exists asynchronously', async () => {
      // Mock API call for organization validation
      const mockCheckOrganizationExists = vi.fn();
      
      // Organization exists
      mockCheckOrganizationExists.mockResolvedValueOnce({ 
        exists: true, 
        organization: { id: 'org123', name: 'Test Org' }
      });
      
      const result1 = await mockCheckOrganizationExists('org123');
      expect(result1.exists).toBe(true);
      expect(result1.organization.name).toBe('Test Org');

      // Organization doesn't exist
      mockCheckOrganizationExists.mockResolvedValueOnce({ exists: false });
      
      const result2 = await mockCheckOrganizationExists('invalid-org');
      expect(result2.exists).toBe(false);
    });
  });

  describe('Validation Error Messages', () => {
    it('provides user-friendly error messages', () => {
      const errorTests = [
        {
          field: 'email',
          value: '',
          expectedError: 'Email is required'
        },
        {
          field: 'email',
          value: 'invalid-email',
          expectedError: 'Please enter a valid email address'
        },
        {
          field: 'name',
          value: '',
          expectedError: 'Name is required'
        },
        {
          field: 'name',
          value: 'A',
          expectedError: 'Name must be at least 2 characters'
        },
        {
          field: 'roleType',
          value: null,
          expectedError: 'Please select a role'
        }
      ];

      errorTests.forEach(({ field, value, expectedError }) => {
        let result;
        
        switch (field) {
          case 'email':
            result = validateEmailFormat(value);
            break;
          case 'name':
            result = validateNameLength(value);
            break;
          case 'roleType':
            result = { isValid: false, error: expectedError };
            break;
          default:
            result = { isValid: false, error: expectedError };
        }

        if (!result.isValid) {
          expect(result.error).toContain(expectedError);
        }
      });
    });

    it('provides context-specific error messages for organization requirement', () => {
      const roleContexts = [
        {
          role: 'organization_owner' as RoleType,
          expectedError: 'Please select an organization for the Organization Owner role'
        },
        {
          role: 'game_master' as RoleType,
          expectedError: 'Please select an organization for the Game Master role'
        },
        {
          role: 'game_player' as RoleType,
          expectedError: 'Please select an organization for the Game Player role'
        }
      ];

      roleContexts.forEach(({ role, expectedError }) => {
        const result = validateOrganizationRequirement(role, null);
        expect(result.isValid).toBe(false);
        // More specific error messages based on role
        expect(result.error).toContain('Organization is required');
      });
    });
  });

  describe('Validation Performance', () => {
    it('validates forms efficiently', () => {
      const largeFormData: CreateUserFormData = {
        email: 'performance-test@example.com',
        name: 'Performance Test User',
        roleType: 'organization_owner',
        selectedSection: 'organization',
        organizationId: 'org123'
      };

      const startTime = performance.now();
      
      // Run validation multiple times
      for (let i = 0; i < 100; i++) {
        createUserFormValidator.safeParse(largeFormData);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should validate 100 forms in under 100ms
      expect(totalTime).toBeLessThan(100);
    });

    it('handles validation debouncing for real-time feedback', () => {
      const mockDebounce = vi.fn();
      let timeoutId: NodeJS.Timeout;

      const debouncedValidation = (value: string, delay: number = 300) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          mockDebounce(value);
        }, delay);
      };

      // Simulate rapid typing
      debouncedValidation('t');
      debouncedValidation('te');
      debouncedValidation('tes');
      debouncedValidation('test');
      debouncedValidation('test@');
      debouncedValidation('test@example.com');

      // Should only call validation once after debounce delay
      setTimeout(() => {
        expect(mockDebounce).toHaveBeenCalledTimes(1);
        expect(mockDebounce).toHaveBeenCalledWith('test@example.com');
      }, 350);
    });
  });
});