/**
 * T008 - Integration Test: Organization Owner Creation
 * 
 * Tests the complete end-to-end flow for creating an organization owner.
 * This test MUST FAIL initially as the features don't exist yet (TDD).
 * 
 * Based on: specs/003-implement-admin-create/quickstart.md - Scenario 2
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

describe('Integration Test: Organization Owner Creation', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: process.env.CI ? 0 : 100
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Scenario 2: Create Organization Owner', () => {
    it('should complete the full organization owner creation flow', async () => {
      // Step 1: Login as system administrator
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Step 2: Navigate to "Create User" page
      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');
      await page.waitForSelector('[data-testid="admin-create-user-form"]');

      // Step 3: Fill Form for Organization Owner
      await page.fill('[data-testid="email-input"]', 'owner@example.com');
      await page.fill('[data-testid="name-input"]', 'Organization Owner');
      
      // Select Organization User type
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');
      
      // Verify organization fields become enabled
      const organizationSelect = page.locator('[data-testid="organization-select"]');
      const organizationRoleSelect = page.locator('[data-testid="organization-role-select"]');
      
      await expect(organizationSelect).toBeEnabled();
      await expect(organizationRoleSelect).toBeEnabled();

      // Select existing organization
      await page.click('[data-testid="organization-select"]');
      await page.waitForSelector('[data-testid="organization-option"]');
      await page.click('[data-testid="organization-option"]:first-child');

      // Select Owner role from Business Roles section
      await page.click('[data-testid="organization-role-select"]');
      
      // Verify role categories are shown
      await expect(page.locator('[data-testid="business-roles-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="game-roles-section"]')).toBeVisible();
      
      // Select Owner from Business Roles
      await page.click('[data-testid="role-option-owner"]');

      // Step 4: Verify form summary
      const summary = page.locator('[data-testid="form-summary"]');
      await expect(summary).toContainText('Creating organization user');
      await expect(summary).toContainText('Role: Organization Owner (business role)');
      await expect(summary).toContainText('owner@example.com');

      // Step 5: Submit form
      await page.click('[data-testid="submit-button"]');

      // Step 6: Verify Results
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      
      const successMessage = page.locator('[data-testid="success-message"]');
      await expect(successMessage).toContainText('Organization owner created successfully');
      await expect(successMessage).toContainText('invitation email sent');

      // Verify invitation details
      const invitationInfo = page.locator('[data-testid="invitation-info"]');
      await expect(invitationInfo).toContainText('Magic link invitation');
      await expect(invitationInfo).toContainText('owner@example.com');
    });

    it('should validate organization selection for organization users', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Fill required fields but skip organization selection
      await page.fill('[data-testid="email-input"]', 'owner-no-org@example.com');
      await page.fill('[data-testid="name-input"]', 'Owner No Org');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');
      
      // Try to submit without selecting organization
      await page.click('[data-testid="submit-button"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="organization-error"]')).toContainText('Organization is required');
      await expect(page.locator('[data-testid="organization-role-error"]')).toContainText('Organization role is required');
    });

    it('should show business role description for organization owner', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      await page.fill('[data-testid="email-input"]', 'owner-desc@example.com');
      await page.fill('[data-testid="name-input"]', 'Owner Description Test');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');

      // Select organization and role to trigger descriptions
      await page.click('[data-testid="organization-select"]');
      await page.click('[data-testid="organization-option"]:first-child');
      await page.click('[data-testid="organization-role-select"]');

      // Verify business role description for owner
      const ownerRoleOption = page.locator('[data-testid="role-option-owner"]');
      await expect(ownerRoleOption).toContainText('Organization Owner');
      await expect(ownerRoleOption).toContainText('Full control over specific organizations');

      await page.click('[data-testid="role-option-owner"]');

      // Verify role information display
      const roleInfo = page.locator('[data-testid="role-info"]');
      await expect(roleInfo).toContainText('Role Type: Business Role');
      await expect(roleInfo).toContainText('Full control over specific organizations');
    });

    it('should handle organization loading and selection', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      await page.fill('[data-testid="email-input"]', 'owner-loading@example.com');
      await page.fill('[data-testid="name-input"]', 'Owner Loading Test');
      
      // Switch to organization user type
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');

      // Verify organization dropdown shows loading state initially
      const organizationSelect = page.locator('[data-testid="organization-select"]');
      await page.click('[data-testid="organization-select"]');
      
      // Should show loading or organizations
      const loadingText = page.locator('[data-testid="organization-loading"]');
      const organizationOptions = page.locator('[data-testid="organization-option"]');
      
      // Wait for either loading to disappear or options to appear
      await page.waitForFunction(() => {
        const loading = document.querySelector('[data-testid="organization-loading"]');
        const options = document.querySelectorAll('[data-testid="organization-option"]');
        return !loading || options.length > 0;
      }, undefined, { timeout: 5000 });

      // Should have at least one organization available
      await expect(organizationOptions.first()).toBeVisible();
    });

    it('should preserve form state when switching between user types', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Fill basic fields
      await page.fill('[data-testid="email-input"]', 'state-test@example.com');
      await page.fill('[data-testid="name-input"]', 'State Test User');

      // Switch to organization user and fill organization fields
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');
      await page.click('[data-testid="organization-select"]');
      await page.click('[data-testid="organization-option"]:first-child');
      await page.click('[data-testid="organization-role-select"]');
      await page.click('[data-testid="role-option-owner"]');

      // Switch back to system admin
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');

      // Verify basic fields are preserved
      await expect(page.locator('[data-testid="email-input"]')).toHaveValue('state-test@example.com');
      await expect(page.locator('[data-testid="name-input"]')).toHaveValue('State Test User');

      // Verify organization fields are disabled/reset
      await expect(page.locator('[data-testid="organization-select"]')).toBeDisabled();
      await expect(page.locator('[data-testid="organization-role-select"]')).toBeDisabled();

      // Switch back to organization user
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');

      // Verify organization fields are enabled but reset
      await expect(page.locator('[data-testid="organization-select"]')).toBeEnabled();
      await expect(page.locator('[data-testid="organization-role-select"]')).toBeEnabled();
    });

    it('should handle organization owner creation with email validation', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Test async email validation
      await page.fill('[data-testid="email-input"]', 'checking@example.com');
      
      // Should show email validation in progress
      await page.waitForSelector('[data-testid="email-validation-loading"]', { timeout: 2000 });
      await expect(page.locator('[data-testid="email-validation-loading"]')).toContainText('Checking email availability');

      // Continue with form
      await page.fill('[data-testid="name-input"]', 'Email Check Owner');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');
      await page.click('[data-testid="organization-select"]');
      await page.click('[data-testid="organization-option"]:first-child');
      await page.click('[data-testid="organization-role-select"]');
      await page.click('[data-testid="role-option-owner"]');

      // Submit form
      await page.click('[data-testid="submit-button"]');

      // Should succeed if email is available
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Organization owner created successfully');
    });
  });

  describe('Role Category Display', () => {
    it('should properly display business and game role categories', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      await page.fill('[data-testid="email-input"]', 'categories@example.com');
      await page.fill('[data-testid="name-input"]', 'Categories Test');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');
      await page.click('[data-testid="organization-select"]');
      await page.click('[data-testid="organization-option"]:first-child');

      // Open role selector
      await page.click('[data-testid="organization-role-select"]');

      // Verify Business Roles section
      const businessSection = page.locator('[data-testid="business-roles-section"]');
      await expect(businessSection).toContainText('Business Roles');
      await expect(businessSection).toContainText('Organization management and administration');
      
      // Verify business role options
      await expect(page.locator('[data-testid="role-option-owner"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-option-admin"]')).toBeVisible();

      // Verify Game Roles section
      const gameSection = page.locator('[data-testid="game-roles-section"]');
      await expect(gameSection).toContainText('Game Roles');
      await expect(gameSection).toContainText('Murder mystery gameplay and operations');

      // Verify game role options
      await expect(page.locator('[data-testid="role-option-gm"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-option-staff"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-option-player"]')).toBeVisible();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle non-existent organization gracefully', async () => {
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Mock scenario where organization doesn't exist (through dev tools or API mock)
      await page.fill('[data-testid="email-input"]', 'nonexistent-org@example.com');
      await page.fill('[data-testid="name-input"]', 'Nonexistent Org Owner');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-organization-user"]');

      // Simulate selecting non-existent organization (this would be mocked in real test)
      await page.evaluate(() => {
        // Simulate API response for non-existent org
        const select = document.querySelector('[data-testid="organization-select"]');
        if (select) {
          (select as HTMLSelectElement).value = '00000000-0000-0000-0000-000000000000';
        }
      });

      await page.click('[data-testid="organization-role-select"]');
      await page.click('[data-testid="role-option-owner"]');
      await page.click('[data-testid="submit-button"]');

      // Should show appropriate error
      await page.waitForSelector('[data-testid="error-message"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Organization not found');
    });
  });
});