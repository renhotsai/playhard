# Quickstart: Admin Create User Page - Role Type Sections Enhancement

**Enhancement**: Two-section role type selection for improved user experience
**Date**: September 15, 2025

## Role Sections Enhancement Overview

The role selection interface has been improved with two distinct sections:

### System Roles Section
- **System Administrator**: Global platform access with full system privileges
- Clear visual separation with dedicated section header and description
- Red theme with "FULL ACCESS" badge to indicate critical permissions

### Organization Roles Section  
- **Organization Owner**: Complete organization ownership and management
- **Organization Administrator**: Administrative privileges within organization
- **Game Master**: Lead murder mystery games and guide player experiences
- **Game Staff**: Support game operations and customer service
- **Game Player**: Participate in murder mystery games and solve puzzles
- Grouped organization with descriptive badges and role-specific descriptions

## Enhanced Test Scenarios

### Scenario A: Role Section Navigation
**Goal**: Verify role section grouping and selection works correctly

1. **Login** as system administrator
2. **Navigate** to "Create User" page
3. **Observe Role Sections**:
   - System Roles section displays with single System Admin option
   - Organization Roles section displays with 5 role options
   - Visual separation between sections is clear
   - Section headers and descriptions are informative
4. **Test Selection**:
   - Select System Admin from System Roles section
   - Verify other organization fields become disabled/hidden
   - Select Game Master from Organization Roles section
   - Verify organization selection becomes required
5. **Verify Accessibility**:
   - Tab navigation flows logically through sections
   - Screen reader announces section changes
   - ARIA labels are properly applied

**Expected Outcome**: Role sections provide clear organization and intuitive selection flow

## Prerequisites
- System administrator account with login access
- Running development environment (Next.js + PostgreSQL + Better Auth)
- Email service configured (Resend) for invitation emails

## Feature Overview
System administrators can create new users with different role types:
- **System Admins**: Full system access across all organizations
- **Organization Owners**: Full control over specific organizations
- **Organization Admins**: Administrative access within specific organizations
- **Game Masters (GM)**: Lead murder mystery games within organizations
- **Game Staff**: Support murder mystery game operations
- **Game Players**: Participate in murder mystery games

## Quick Test Scenarios

### Scenario 1: Create System Administrator
**Goal**: Verify system admin creation flow

1. **Login** as system administrator
2. **Navigate** to sidebar → "Create User" (admin-only menu item)
3. **Fill Form**:
   - Email: `newadmin@example.com`
   - Name: `New System Admin`
   - User Type: Select `System Admin`
4. **Submit** form
5. **Verify Results**:
   - Success message displayed
   - Email invitation sent
   - User created with system admin role

**Expected Outcome**: New system admin account created, invitation email sent

### Scenario 2: Create Organization Owner
**Goal**: Verify organization owner creation flow

1. **Login** as system administrator  
2. **Navigate** to "Create User" page
3. **Fill Form**:
   - Email: `owner@example.com`
   - Name: `Organization Owner`
   - User Type: Select `Organization User`
   - Organization: Select existing organization
   - Role: Select `Owner`
4. **Submit** form
5. **Verify Results**:
   - Success message displayed
   - User created with organization owner role
   - Invitation email with organization context sent

**Expected Outcome**: New organization owner created, linked to selected organization

### Scenario 3: Create Organization Admin
**Goal**: Verify organization admin creation flow

1. **Login** as system administrator
2. **Navigate** to "Create User" page  
3. **Fill Form**:
   - Email: `orgadmin@example.com`
   - Name: `Organization Admin`
   - User Type: Select `Organization User`
   - Organization: Select existing organization
   - Role: Select `Admin`
4. **Submit** form
5. **Verify Results**:
   - Success message displayed
   - User created with organization admin role
   - Organization membership established

**Expected Outcome**: New organization admin created with limited scope

### Scenario 4: Create Game Master
**Goal**: Verify Game Master creation for murder mystery games

1. **Login** as system administrator
2. **Navigate** to "Create User" page  
3. **Fill Form**:
   - Email: `gm@example.com`
   - Name: `Game Master`
   - User Type: Select `Organization User`
   - Organization: Select existing organization
   - Role: Select `Game Master (GM)`
4. **Submit** form
5. **Verify Results**:
   - Success message displayed
   - User created with GM role for game leadership
   - Organization membership with game management permissions

**Expected Outcome**: New Game Master created with murder mystery game leadership capabilities

### Scenario 5: Create Game Staff
**Goal**: Verify Game Staff creation for murder mystery operations

1. **Login** as system administrator
2. **Navigate** to "Create User" page  
3. **Fill Form**:
   - Email: `staff@example.com`
   - Name: `Game Staff Member`
   - User Type: Select `Organization User`
   - Organization: Select existing organization
   - Role: Select `Staff`
4. **Submit** form
5. **Verify Results**:
   - Success message displayed
   - User created with staff role for game operations
   - Organization membership with game support permissions

**Expected Outcome**: New Game Staff created with operational support capabilities

### Scenario 6: Create Game Player
**Goal**: Verify Game Player creation for murder mystery participation

1. **Login** as system administrator
2. **Navigate** to "Create User" page  
3. **Fill Form**:
   - Email: `player@example.com`
   - Name: `Game Player`
   - User Type: Select `Organization User`
   - Organization: Select existing organization
   - Role: Select `Player`
4. **Submit** form
5. **Verify Results**:
   - Success message displayed
   - User created with player role for game participation
   - Organization membership with game access permissions

**Expected Outcome**: New Game Player created with murder mystery participation access

## Validation Testing

### Form Validation
1. **Empty Email**: Submit with empty email → Show validation error
2. **Invalid Email**: Enter "invalid-email" → Show format error
3. **Duplicate Email**: Use existing user email → Show uniqueness error
4. **Empty Name**: Submit without name → Show required field error
5. **Missing Organization**: Select "Organization User" without organization → Show validation error
6. **Missing Role**: Select organization without role → Show validation error

### Permission Testing  
1. **Non-Admin Access**: Login as regular user → Page not accessible
2. **Unauthenticated Access**: Access URL without login → Redirect to login
3. **Organization Selection**: Only existing organizations shown in dropdown
4. **Role Assignment**: Only valid roles (owner, admin) available for selection

### Error Handling
1. **Network Error**: Simulate API failure → Show error message with retry
2. **Server Error**: Invalid organization ID → Show server error
3. **Email Service Down**: Email sending fails → Show partial success with warning
4. **Database Error**: Database unavailable → Show system error

## Integration Testing

### Email Flow
1. Create user successfully
2. Check email delivery (development: logs, production: email service)
3. Click magic link in email
4. Verify redirect to account setup
5. Complete username setup
6. Verify login with new account

### Role Verification
1. Create system admin → Login → Verify full system access
2. Create org owner → Login → Verify organization management access
3. Create org admin → Login → Verify limited organization access
4. Verify role hierarchy and permissions work correctly

### Database Verification
```sql
-- Verify system admin creation
SELECT * FROM "User" WHERE role = 'admin' AND email = 'newadmin@example.com';

-- Verify organization user creation  
SELECT u.*, m.role as org_role, o.name as org_name
FROM "User" u
JOIN "Member" m ON u.id = m."userId"  
JOIN "Organization" o ON m."organizationId" = o.id
WHERE u.email = 'owner@example.com';

-- Verify invitation creation
SELECT * FROM "Invitation" WHERE email = 'newuser@example.com';
```

## Performance Benchmarks

### Response Times (Target < 200ms)
- Form load: < 100ms
- Organization list fetch: < 150ms  
- User creation: < 200ms
- Email sending: < 500ms (async)

### Load Testing
- 10 concurrent admin users creating users
- 50 user creations per minute
- Form should remain responsive
- No database deadlocks

## Troubleshooting

### Common Issues

**"Create User" not visible in sidebar**
- Verify user has system admin role (`user.role = 'admin'`)
- Check session authentication  
- Verify sidebar component updated

**Form validation not working**
- Check browser console for JavaScript errors
- Verify Zod schema validation
- Check TanStack Form configuration

**User creation fails**
- Verify database connection
- Check Better Auth configuration
- Verify Prisma schema is up to date
- Check API route permissions

**Email not sent**
- Verify Resend API key configuration
- Check email service status
- Verify email template exists
- Check server logs for email errors

**Organization dropdown empty**
- Verify organizations exist in database
- Check admin API permissions
- Verify organization list API endpoint

### Debug Commands
```bash
# Check user role
npm run dev -- --inspect-user [userId]

# Test email service
npm run dev -- --test-email

# Verify database schema
npx prisma db pull && npx prisma generate

# Check API routes
curl -X GET http://localhost:3000/api/admin/organizations -H "Cookie: session=..."
```

## Manual Test Checklist

- [ ] System admin can access create user page
- [ ] Non-admin users cannot access page  
- [ ] Form validates all required fields
- [ ] Email format validation works
- [ ] Duplicate email prevention works
- [ ] Organization selection populates correctly
- [ ] System admin creation works
- [ ] Organization owner creation works
- [ ] Organization admin creation works
- [ ] Success feedback displayed
- [ ] Error handling works for all scenarios
- [ ] Email invitations sent successfully
- [ ] Created users can complete onboarding
- [ ] Role assignments work correctly
- [ ] Sidebar navigation item visible for admins only

## Success Criteria
✅ System administrators can create different user types  
✅ Form validation prevents invalid submissions  
✅ Role assignments work correctly across user types  
✅ Email invitations sent automatically  
✅ Integration with existing Better Auth system  
✅ Proper error handling and user feedback  
✅ Performance meets target response times  
✅ Security controls prevent unauthorized access