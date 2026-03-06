/**
 * Unit Tests: Role Section Utilities
 * 
 * Tests all utility functions for the role section system.
 * These tests MUST fail until the utilities are properly implemented.
 * 
 * TDD Phase: RED - Write failing tests first
 */

import { describe, it, expect } from 'vitest';
import {
  getRoleSectionType,
  getGroupedRoles,
  requiresOrganization,
  getRoleDisplayInfo,
  validateRoleSelection,
  getSectionConfig,
  getSectionRoleIds,
  areInSameSection,
  getDefaultRoleForSection,
  formatRoleForSubmission,
  getAvailableTransitions,
  getRoleSectionStats,
  getRoleSpecificSuccessMessage
} from '@/lib/role-section-utils';
import { 
  type RoleType,
  type RoleSection,
  DEFAULT_ROLE_SECTIONS 
} from '@/types/role-sections';

describe('Role Section Utilities', () => {
  describe('getRoleSectionType', () => {
    it('returns system for system_admin role', () => {
      const result = getRoleSectionType('system_admin');
      expect(result).toBe('system');
    });

    it('returns organization for organization roles', () => {
      expect(getRoleSectionType('organization_owner')).toBe('organization');
      expect(getRoleSectionType('organization_admin')).toBe('organization');
      expect(getRoleSectionType('game_master')).toBe('organization');
      expect(getRoleSectionType('game_staff')).toBe('organization');
      expect(getRoleSectionType('game_player')).toBe('organization');
    });
  });

  describe('getGroupedRoles', () => {
    it('returns roles grouped by section', () => {
      const grouped = getGroupedRoles();
      
      expect(grouped).toHaveProperty('system');
      expect(grouped).toHaveProperty('organization');
      
      expect(grouped.system).toContain('system_admin');
      expect(grouped.organization).toContain('organization_owner');
      expect(grouped.organization).toContain('game_master');
    });

    it('returns correct number of roles per section', () => {
      const grouped = getGroupedRoles();
      
      expect(grouped.system).toHaveLength(1); // Only system_admin
      expect(grouped.organization).toHaveLength(5); // 5 organization roles
    });

    it('includes all expected organization roles', () => {
      const grouped = getGroupedRoles();
      
      expect(grouped.organization).toEqual(
        expect.arrayContaining([
          'organization_owner',
          'organization_admin',
          'game_master',
          'game_staff',
          'game_player'
        ])
      );
    });
  });

  describe('requiresOrganization', () => {
    it('returns false for system roles', () => {
      expect(requiresOrganization('system_admin')).toBe(false);
    });

    it('returns true for organization roles', () => {
      expect(requiresOrganization('organization_owner')).toBe(true);
      expect(requiresOrganization('organization_admin')).toBe(true);
      expect(requiresOrganization('game_master')).toBe(true);
      expect(requiresOrganization('game_staff')).toBe(true);
      expect(requiresOrganization('game_player')).toBe(true);
    });
  });

  describe('getRoleDisplayInfo', () => {
    it('returns display info for system admin', () => {
      const info = getRoleDisplayInfo('system_admin');
      
      expect(info).toMatchObject({
        label: 'System Administrator',
        description: expect.stringContaining('Complete system control'),
        section: 'system',
        badge: {
          text: 'FULL ACCESS',
          variant: 'destructive'
        }
      });
    });

    it('returns display info for organization owner', () => {
      const info = getRoleDisplayInfo('organization_owner');
      
      expect(info).toMatchObject({
        label: 'Organization Owner',
        description: expect.stringContaining('Complete organization ownership'),
        section: 'organization',
        badge: {
          text: 'OWNER',
          variant: 'default'
        }
      });
    });

    it('returns display info for game master', () => {
      const info = getRoleDisplayInfo('game_master');
      
      expect(info).toMatchObject({
        label: 'Game Master',
        description: expect.stringContaining('Lead murder mystery games'),
        section: 'organization',
        badge: {
          text: 'GM',
          variant: 'default'
        }
      });
    });

    it('returns null for invalid role', () => {
      const info = getRoleDisplayInfo('invalid_role' as RoleType);
      expect(info).toBeNull();
    });
  });

  describe('validateRoleSelection', () => {
    it('validates system admin role', () => {
      const result = validateRoleSelection('system_admin');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.section).toBe('system');
    });

    it('validates organization roles', () => {
      const roles: RoleType[] = ['organization_owner', 'organization_admin', 'game_master', 'game_staff', 'game_player'];
      
      roles.forEach(role => {
        const result = validateRoleSelection(role);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.section).toBe('organization');
      });
    });

    it('rejects invalid role', () => {
      const result = validateRoleSelection('invalid_role' as RoleType);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid role: invalid_role');
    });
  });

  describe('getSectionConfig', () => {
    it('returns system section config', () => {
      const config = getSectionConfig('system');
      
      expect(config).toMatchObject({
        section: 'system',
        title: 'System Roles',
        description: expect.stringContaining('Global platform administration'),
        roles: expect.arrayContaining([
          expect.objectContaining({ id: 'system_admin' })
        ])
      });
    });

    it('returns organization section config', () => {
      const config = getSectionConfig('organization');
      
      expect(config).toMatchObject({
        section: 'organization',
        title: 'Organization Roles',
        description: expect.stringContaining('Organization-specific roles'),
        roles: expect.arrayContaining([
          expect.objectContaining({ id: 'organization_owner' }),
          expect.objectContaining({ id: 'game_master' })
        ])
      });
    });

    it('returns null for invalid section', () => {
      const config = getSectionConfig('invalid' as RoleSection);
      expect(config).toBeNull();
    });
  });

  describe('getSectionRoleIds', () => {
    it('returns system role IDs', () => {
      const roleIds = getSectionRoleIds('system');
      
      expect(roleIds).toEqual(['system_admin']);
    });

    it('returns organization role IDs', () => {
      const roleIds = getSectionRoleIds('organization');
      
      expect(roleIds).toEqual(
        expect.arrayContaining([
          'organization_owner',
          'organization_admin',
          'game_master',
          'game_staff',
          'game_player'
        ])
      );
      expect(roleIds).toHaveLength(5);
    });

    it('returns empty array for invalid section', () => {
      const roleIds = getSectionRoleIds('invalid' as RoleSection);
      expect(roleIds).toEqual([]);
    });
  });

  describe('areInSameSection', () => {
    it('returns true for roles in system section', () => {
      const result = areInSameSection('system_admin', 'system_admin');
      expect(result).toBe(true);
    });

    it('returns true for roles in organization section', () => {
      expect(areInSameSection('organization_owner', 'game_master')).toBe(true);
      expect(areInSameSection('game_staff', 'game_player')).toBe(true);
    });

    it('returns false for roles in different sections', () => {
      expect(areInSameSection('system_admin', 'organization_owner')).toBe(false);
      expect(areInSameSection('system_admin', 'game_master')).toBe(false);
    });
  });

  describe('getDefaultRoleForSection', () => {
    it('returns default role for system section', () => {
      const defaultRole = getDefaultRoleForSection('system');
      expect(defaultRole).toBe('system_admin');
    });

    it('returns default role for organization section', () => {
      const defaultRole = getDefaultRoleForSection('organization');
      expect(defaultRole).toBe('organization_owner'); // First in the list
    });

    it('returns null for invalid section', () => {
      const defaultRole = getDefaultRoleForSection('invalid' as RoleSection);
      expect(defaultRole).toBeNull();
    });
  });

  describe('formatRoleForSubmission', () => {
    it('formats system admin role for submission', () => {
      const formatted = formatRoleForSubmission('system_admin');
      
      expect(formatted).toMatchObject({
        roleId: 'system_admin',
        section: 'system',
        requiresOrganization: false,
        displayName: 'System Administrator'
      });
    });

    it('formats organization role for submission', () => {
      const formatted = formatRoleForSubmission('game_master');
      
      expect(formatted).toMatchObject({
        roleId: 'game_master',
        section: 'organization',
        requiresOrganization: true,
        displayName: 'Game Master'
      });
    });

    it('throws error for invalid role', () => {
      expect(() => {
        formatRoleForSubmission('invalid_role' as RoleType);
      }).toThrow('Invalid role: invalid_role');
    });
  });

  describe('getAvailableTransitions', () => {
    it('returns available transitions from system admin', () => {
      const transitions = getAvailableTransitions('system_admin');
      
      expect(transitions.withinSection).toEqual([]); // No other system roles
      expect(transitions.crossSection).toEqual(
        expect.arrayContaining([
          'organization_owner',
          'organization_admin',
          'game_master',
          'game_staff',
          'game_player'
        ])
      );
      expect(transitions.all).toEqual(transitions.crossSection);
    });

    it('returns available transitions from organization owner', () => {
      const transitions = getAvailableTransitions('organization_owner');
      
      expect(transitions.withinSection).toEqual(
        expect.arrayContaining([
          'organization_admin',
          'game_master',
          'game_staff',
          'game_player'
        ])
      );
      expect(transitions.crossSection).toEqual(['system_admin']);
      expect(transitions.all).toEqual([...transitions.withinSection, ...transitions.crossSection]);
    });

    it('returns available transitions from game master', () => {
      const transitions = getAvailableTransitions('game_master');
      
      expect(transitions.withinSection).toEqual(
        expect.arrayContaining([
          'organization_owner',
          'organization_admin',
          'game_staff',
          'game_player'
        ])
      );
      expect(transitions.crossSection).toEqual(['system_admin']);
    });
  });

  describe('getRoleSectionStats', () => {
    it('returns correct role section statistics', () => {
      const stats = getRoleSectionStats();
      
      expect(stats).toMatchObject({
        total: 6, // 1 system + 5 organization
        system: {
          count: 1,
          roles: ['system_admin']
        },
        organization: {
          count: 5,
          roles: expect.arrayContaining([
            'organization_owner',
            'organization_admin',
            'game_master',
            'game_staff',
            'game_player'
          ])
        }
      });
    });

    it('has consistent total count', () => {
      const stats = getRoleSectionStats();
      
      expect(stats.total).toBe(stats.system.count + stats.organization.count);
    });
  });

  describe('getRoleSpecificSuccessMessage', () => {
    it('returns system admin success message', () => {
      const message = getRoleSpecificSuccessMessage('system_admin', 'John Doe');
      
      expect(message).toMatchObject({
        title: 'System Administrator Created!',
        description: expect.stringContaining('John Doe has been granted full system administrator access')
      });
    });

    it('returns organization owner success message', () => {
      const message = getRoleSpecificSuccessMessage('organization_owner', 'Jane Smith', 'Acme Corp');
      
      expect(message).toMatchObject({
        title: 'Organization Owner Created!',
        description: expect.stringContaining('Jane Smith has been assigned as an owner of Acme Corp')
      });
    });

    it('returns game master success message', () => {
      const message = getRoleSpecificSuccessMessage('game_master', 'Alex Johnson', 'Mystery Games Inc');
      
      expect(message).toMatchObject({
        title: 'Game Master Created!',
        description: expect.stringContaining('Alex Johnson has been registered as a Game Master for Mystery Games Inc')
      });
    });

    it('returns game staff success message', () => {
      const message = getRoleSpecificSuccessMessage('game_staff', 'Sam Wilson');
      
      expect(message).toMatchObject({
        title: 'Game Staff Created!',
        description: expect.stringContaining('Sam Wilson has been added as Game Staff')
      });
    });

    it('returns game player success message', () => {
      const message = getRoleSpecificSuccessMessage('game_player', 'Pat Miller', 'Fun Games');
      
      expect(message).toMatchObject({
        title: 'Game Player Created!',
        description: expect.stringContaining('Pat Miller has been registered as a Game Player for Fun Games')
      });
    });

    it('returns default message for unknown role', () => {
      const message = getRoleSpecificSuccessMessage('invalid_role' as RoleType, 'Test User');
      
      expect(message).toMatchObject({
        title: 'User Created Successfully!',
        description: expect.stringContaining('Test User has been added to the system')
      });
    });

    it('handles missing organization name gracefully', () => {
      const message = getRoleSpecificSuccessMessage('organization_owner', 'John Doe');
      
      expect(message.description).toContain('of the organization');
      expect(message.description).not.toContain('undefined');
    });
  });

  describe('Integration Tests', () => {
    it('maintains consistency between role definitions and utilities', () => {
      // Test that all roles in DEFAULT_ROLE_SECTIONS are handled by utilities
      DEFAULT_ROLE_SECTIONS.forEach(section => {
        section.roles.forEach(role => {
          expect(() => getRoleSectionType(role.id)).not.toThrow();
          expect(() => requiresOrganization(role.id)).not.toThrow();
          expect(() => getRoleDisplayInfo(role.id)).not.toThrow();
          expect(() => validateRoleSelection(role.id)).not.toThrow();
          expect(() => formatRoleForSubmission(role.id)).not.toThrow();
        });
      });
    });

    it('ensures all utility functions return consistent data', () => {
      const allRoles = [
        'system_admin',
        'organization_owner',
        'organization_admin',
        'game_master',
        'game_staff',
        'game_player'
      ] as RoleType[];

      allRoles.forEach(role => {
        const sectionType = getRoleSectionType(role);
        const displayInfo = getRoleDisplayInfo(role);
        const validation = validateRoleSelection(role);
        const formatted = formatRoleForSubmission(role);

        // Ensure consistency across utilities
        expect(displayInfo?.section).toBe(sectionType);
        expect(validation.section).toBe(sectionType);
        expect(formatted.section).toBe(sectionType);
        expect(formatted.displayName).toBe(displayInfo?.label);
      });
    });
  });

  describe('Performance Tests', () => {
    it('utility functions execute within performance budget', () => {
      const roles: RoleType[] = ['system_admin', 'organization_owner', 'game_master'];
      
      roles.forEach(role => {
        const startTime = performance.now();
        
        // Run all utility functions
        getRoleSectionType(role);
        requiresOrganization(role);
        getRoleDisplayInfo(role);
        validateRoleSelection(role);
        formatRoleForSubmission(role);
        getAvailableTransitions(role);
        
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        expect(executionTime).toBeLessThan(10); // <10ms for all utilities
      });
    });

    it('handles rapid consecutive calls efficiently', () => {
      const startTime = performance.now();
      
      // Simulate rapid role switching in UI
      for (let i = 0; i < 100; i++) {
        getRoleSectionType('system_admin');
        getRoleSectionType('organization_owner');
        getRoleSectionType('game_master');
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(50); // <50ms for 300 calls
    });
  });
});