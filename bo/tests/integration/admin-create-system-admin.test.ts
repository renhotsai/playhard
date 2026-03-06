/**
 * T007 - Integration Test: System Admin Creation
 * 
 * Tests the complete end-to-end flow for creating a system administrator.
 * This test MUST FAIL initially as the features don't exist yet (TDD).
 * 
 * Based on: specs/003-implement-admin-create/quickstart.md - Scenario 1
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

describe('Integration Test: System Admin Creation', () => {
  let browser: Browser;
  let page: Page;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: process.env.CI ? 0 : 100 // Slow down in dev for debugging
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Set up test data or login state if needed
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Scenario 1: Create System Administrator', () => {
    it('should complete the full system admin creation flow', async () => {
      // Step 1: Login as system administrator
      await page.goto(`${baseUrl}/login`);
      
      // Mock or use test credentials for system admin
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      
      // Wait for login to complete and redirect to dashboard
      await page.waitForURL('**/dashboard**');
      expect(page.url()).toContain('/dashboard');

      // Step 2: Navigate to "Create User" from sidebar
      await page.waitForSelector('[data-testid="app-sidebar"]');
      
      // Verify "Create User" menu item is visible (admin-only)
      const createUserLink = page.locator('[data-testid="create-user-menu-item"]');
      await expect(createUserLink).toBeVisible();
      
      await createUserLink.click();
      
      // Wait for navigation to create user page
      await page.waitForURL('**/admin/users/create**');
      expect(page.url()).toContain('/admin/users/create');

      // Step 3: Verify page loads with correct form
      await page.waitForSelector('[data-testid="admin-create-user-form"]');
      
      // Verify form title and description
      await expect(page.locator('h2')).toContainText('Create User');
      await expect(page.locator('text=system administrator')).toBeVisible();

      // Step 4: Fill Form for System Admin
      // Email field
      await page.fill('[data-testid="email-input"]', 'newadmin@example.com');
      
      // Name field  
      await page.fill('[data-testid="name-input"]', 'New System Admin');
      
      // User Type selection
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');
      
      // Verify organization fields are disabled/hidden for system admin
      const organizationSelect = page.locator('[data-testid="organization-select"]');
      const organizationRoleSelect = page.locator('[data-testid="organization-role-select"]');
      
      await expect(organizationSelect).toBeDisabled();
      await expect(organizationRoleSelect).toBeDisabled();

      // Step 5: Submit form
      await page.click('[data-testid="submit-button"]');

      // Step 6: Verify Results
      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      
      const successMessage = page.locator('[data-testid="success-message"]');
      await expect(successMessage).toContainText('System administrator created successfully');
      await expect(successMessage).toContainText('invitation email sent');

      // Verify form shows summary
      const summary = page.locator('[data-testid="creation-summary"]');
      await expect(summary).toContainText('Creating system administrator');
      await expect(summary).toContainText('newadmin@example.com');

      // Verify redirect to users list or success page
      // Could redirect to /dashboard/users or stay on form with success state
      await page.waitForTimeout(2000); // Allow time for any redirects
    });

    it('should validate email uniqueness for system admin creation', async () => {
      // Login as system admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Navigate to create user page
      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Fill form with existing email
      await page.fill('[data-testid="email-input"]', 'existing@example.com');
      await page.fill('[data-testid="name-input"]', 'Duplicate Admin');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');

      // Submit form
      await page.click('[data-testid="submit-button"]');

      // Verify error message
      await page.waitForSelector('[data-testid="error-message"]');
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toContainText('email already exists');
    });

    it('should show proper validation errors for system admin form', async () => {
      // Login as system admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Navigate to create user page
      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Submit empty form
      await page.click('[data-testid="submit-button"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
      await expect(page.locator('[data-testid="user-type-error"]')).toContainText('User type is required');

      // Test invalid email format
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="name-input"]', 'Test Name');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');
      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    });

    it('should handle loading states during system admin creation', async () => {
      // Login as system admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Navigate to create user page
      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Fill valid form
      await page.fill('[data-testid="email-input"]', 'loading-test@example.com');
      await page.fill('[data-testid="name-input"]', 'Loading Test Admin');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');

      // Submit and verify loading state
      await page.click('[data-testid="submit-button"]');

      // Check loading state immediately after submit
      const submitButton = page.locator('[data-testid="submit-button"]');
      await expect(submitButton).toContainText('Creating user...');
      await expect(submitButton).toBeDisabled();

      // Verify loading state ends
      await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
      await expect(submitButton).not.toBeDisabled();
    });

    it('should display proper form summary for system admin creation', async () => {
      // Login as system admin  
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Navigate to create user page
      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Fill form and verify summary updates
      await page.fill('[data-testid="email-input"]', 'summary-test@example.com');
      await page.fill('[data-testid="name-input"]', 'Summary Test Admin');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');

      // Verify form summary shows correct information
      const summary = page.locator('[data-testid="form-summary"]');
      await expect(summary).toContainText('Creating system administrator');
      await expect(summary).toContainText('summary-test@example.com');
      await expect(summary).not.toContainText('Organization');
      await expect(summary).not.toContainText('Role');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should redirect unauthenticated users to login', async () => {
      // Try to access create user page without login
      await page.goto(`${baseUrl}/admin/users/create`);
      
      // Should redirect to login page
      await page.waitForURL('**/login**');
      expect(page.url()).toContain('/login');
    });

    it('should deny access to non-admin users', async () => {
      // Login as non-admin user
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'member@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Try to access create user page
      await page.goto(`${baseUrl}/admin/users/create`);
      
      // Should show 403 error or redirect
      await page.waitForSelector('[data-testid="access-denied"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="access-denied"]')).toContainText('Access denied');
    });

    it('should not show create user menu item for non-admin users', async () => {
      // Login as non-admin user
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'member@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Verify "Create User" menu item is not visible
      await page.waitForSelector('[data-testid="app-sidebar"]');
      const createUserLink = page.locator('[data-testid="create-user-menu-item"]');
      await expect(createUserLink).not.toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully during system admin creation', async () => {
      // Login as system admin
      await page.goto(`${baseUrl}/login`);
      await page.fill('[data-testid="email-input"]', 'testadmin@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('**/dashboard**');

      // Navigate to create user page
      await page.click('[data-testid="create-user-menu-item"]');
      await page.waitForURL('**/admin/users/create**');

      // Mock server error by using special test email
      await page.fill('[data-testid="email-input"]', 'server-error@example.com');
      await page.fill('[data-testid="name-input"]', 'Server Error Test');
      await page.click('[data-testid="user-type-select"]');
      await page.click('[data-testid="user-type-system-admin"]');

      await page.click('[data-testid="submit-button"]');

      // Verify error handling
      await page.waitForSelector('[data-testid="error-message"]');
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toContainText('Failed to create user');
      
      // Verify form remains functional
      const submitButton = page.locator('[data-testid="submit-button"]');
      await expect(submitButton).not.toBeDisabled();
    });
  });
});