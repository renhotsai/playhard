# Quickstart: Hierarchical Role Selection Enhancement

**Enhancement**: Step-by-step role selection with mutually exclusive category display  
**Date**: September 17, 2025  
**Feature**: Users first choose between System or Organization, then see only relevant roles

## Hierarchical Selection Overview

The new hierarchical role selection replaces the side-by-side interface with a progressive disclosure pattern:

### Step 1: Category Selection
- **System Roles**: Single category option for system-wide administration
- **Organization Roles**: Single category option for organization-specific roles
- Clear visual separation with descriptive cards and icons
- Only one category can be selected at a time

### Step 2: Role Selection (Conditional Display)
- **If System Selected**: Shows only System Administrator role
- **If Organization Selected**: Shows 5 organization roles (Owner, Admin, Game Master, Staff, Player)
- Previous step's selection determines what roles are visible
- Organization selector appears only for organization roles

## Enhanced Test Scenarios

### Scenario A: Hierarchical Navigation Flow
**Goal**: Verify step-by-step selection and conditional role display

1. **Login** as system administrator
2. **Navigate** to "Create User" page
3. **Observe Initial State**:
   - Step indicator shows "Category Selection" as current step
   - Two category cards displayed: "System Roles" and "Organization Roles"
   - No role options visible yet
   - Next step is disabled until category selection
4. **Test System Path**:
   - Click "System Roles" category card
   - Verify role section shows only "System Administrator" option
   - Verify organization roles are completely hidden (not just disabled)
   - Verify organization selector is not displayed
   - Verify step indicator shows progress to "Role Selection"
5. **Test Organization Path**:
   - Click back button or category breadcrumb
   - Select "Organization Roles" category card
   - Verify role section shows only organization roles (5 total)
   - Verify system roles are completely hidden
   - Verify organization selector appears and is required
   - Test selecting different organization roles
6. **Test Navigation**:
   - Verify back navigation from role step to category step
   - Verify category selection resets role selection
   - Verify form state updates correctly during navigation

**Expected Outcome**: Clean step-by-step progression with mutually exclusive role display

### Scenario B: Form Validation with Steps
**Goal**: Verify validation works correctly across steps

1. **Login** as system administrator
2. **Navigate** to "Create User" page
3. **Test Step Validation**:
   - Try to proceed without selecting category → Show validation error
   - Select category, proceed to role step
   - Try to submit without selecting role → Show validation error
   - For organization path, try to submit without organization → Show validation error
4. **Test Cross-Step Validation**:
   - Ensure form remembers selections when navigating back
   - Verify changing category clears incompatible selections
   - Test validation message clarity and helpfulness

**Expected Outcome**: Clear validation feedback at each step with proper error messaging

## Prerequisites
- System administrator account with login access
- Running development environment (Next.js + PostgreSQL + Better Auth)
- Email service configured (Resend) for invitation emails
- Updated role selection components with hierarchical interface

## Feature Overview
The hierarchical role selection improves user experience by:
- **Progressive Disclosure**: Only showing relevant information at each step
- **Reduced Cognitive Load**: Fewer options visible at once
- **Clear Mental Model**: Category first, then specific role
- **Better Mobile Experience**: Less cluttered interface on small screens

## Quick Test Scenarios

### Scenario 1: Create System Administrator (Hierarchical Flow)
**Goal**: Verify hierarchical system admin creation flow

1. **Login** as system administrator
2. **Navigate** to sidebar → "Create User"
3. **Step 1 - Category Selection**:
   - Observe two category options displayed
   - Click "System Roles" card
   - Verify progression to role selection step
4. **Step 2 - Role Selection**:
   - Verify only "System Administrator" role is visible
   - Verify no organization selector displayed
   - Select "System Administrator" role
5. **Complete Form**:
   - Fill Email: `newadmin@example.com`
   - Fill Name: `New System Admin`
   - Submit form
6. **Verify Results**:
   - Success message displayed
   - Email invitation sent
   - User created with system admin role

**Expected Outcome**: Clean hierarchical flow for system admin creation

### Scenario 2: Create Organization Owner (Hierarchical Flow)
**Goal**: Verify hierarchical organization owner creation flow

1. **Login** as system administrator  
2. **Navigate** to "Create User" page
3. **Step 1 - Category Selection**:
   - Click "Organization Roles" card
   - Verify progression to role selection step
4. **Step 2 - Role Selection**:
   - Verify only organization roles visible (5 roles)
   - Verify system roles completely hidden
   - Verify organization selector appears
   - Select "Organization Owner" role
   - Select target organization from dropdown
5. **Complete Form**:
   - Fill Email: `owner@example.com`
   - Fill Name: `Organization Owner`
   - Submit form
6. **Verify Results**:
   - Success message displayed
   - User created with organization owner role
   - Proper organization association

**Expected Outcome**: Hierarchical flow with conditional organization selection

### Scenario 3: Navigation Between Categories
**Goal**: Verify category switching and state management

1. **Login** as system administrator
2. **Navigate** to "Create User" page
3. **Test Category Switching**:
   - Select "System Roles" category
   - Proceed to role selection
   - Select "System Administrator" role
   - Navigate back to category selection
   - Switch to "Organization Roles" category
   - Verify system role selection is cleared
   - Verify organization role options are displayed
   - Select "Game Master" role
   - Verify organization selector appears
4. **Test Form State**:
   - Verify form fields update correctly during navigation
   - Verify validation state resets appropriately
   - Test multiple back/forward navigation cycles

**Expected Outcome**: Smooth navigation with proper state management

### Scenario 4: Create Game Master (Hierarchical Flow)
**Goal**: Verify Game Master creation with hierarchical interface

1. **Login** as system administrator
2. **Navigate** to "Create User" page  
3. **Step 1 - Category Selection**:
   - Select "Organization Roles" category
4. **Step 2 - Role Selection**:
   - Verify Game Master role visible in organization roles
   - Select "Game Master (GM)" role
   - Select organization from dropdown
5. **Complete Form**:
   - Fill Email: `gm@example.com`
   - Fill Name: `Game Master`
   - Submit form
6. **Verify Results**:
   - User created with GM role for murder mystery games
   - Proper organization membership established

**Expected Outcome**: Hierarchical flow for game-specific roles

### Scenario 5: Mobile Interface Testing
**Goal**: Verify hierarchical interface works well on mobile devices

1. **Open** browser developer tools, switch to mobile view
2. **Login** as system administrator
3. **Navigate** to "Create User" page
4. **Test Mobile Experience**:
   - Verify category cards are touch-friendly
   - Verify step indicator is visible and clear
   - Test navigation between steps on mobile
   - Verify role cards are properly sized
   - Test organization dropdown on mobile
5. **Complete Flow**:
   - Create a user using touch navigation
   - Verify form submission works on mobile

**Expected Outcome**: Optimized mobile experience with hierarchical flow

## Validation Testing

### Step-by-Step Validation
1. **Category Validation**: Try to proceed without category selection → Show step-specific error
2. **Role Validation**: Try to proceed without role selection → Show validation with context
3. **Organization Validation**: For org roles, try to proceed without organization → Clear error message
4. **Email Validation**: Test email format validation across steps
5. **Navigation Validation**: Ensure validation state updates correctly during step changes

### Progressive Enhancement Testing  
1. **JavaScript Disabled**: Test that basic form still works (graceful degradation)
2. **Slow Connection**: Test loading states during step transitions
3. **Keyboard Navigation**: Verify full keyboard accessibility across steps
4. **Screen Reader**: Test with screen reader for step announcements

### Error Handling
1. **Network Errors**: Simulate API failures during step transitions
2. **Invalid Data**: Test with malformed category/role data
3. **Session Timeout**: Test behavior when session expires mid-flow
4. **Browser Back Button**: Verify proper handling of browser navigation

## Integration Testing

### Form Integration
1. Verify TanStack Form integration maintains validation across steps
2. Test form field updates during step navigation
3. Verify proper form submission with hierarchical data
4. Test form reset functionality

### Component Integration
1. Test integration with existing role selection utilities
2. Verify proper data flow between step components
3. Test error boundary behavior for step components
4. Verify proper cleanup on component unmount

### API Integration
1. Test organization data loading for role selection step
2. Verify proper user creation with hierarchical role data
3. Test email invitation system with new role structure
4. Verify database updates match hierarchical selections

## Performance Testing

### Rendering Performance
- Category selection: < 50ms initial render
- Role step transition: < 100ms with smooth animation
- Organization data loading: < 200ms for dropdown population
- Form submission: < 300ms total time

### Memory Usage
- Test for memory leaks during step navigation
- Verify proper component cleanup
- Monitor state management overhead
- Test with multiple back/forward cycles

### Accessibility Performance
- Screen reader announcement timing: < 200ms
- Keyboard navigation response: < 50ms
- Focus management during transitions: Immediate

## Browser Compatibility Testing

### Modern Browsers
- Chrome 90+: Full feature support
- Firefox 88+: Full feature support  
- Safari 14+: Full feature support
- Edge 90+: Full feature support

### Mobile Browsers
- iOS Safari: Touch navigation and step transitions
- Chrome Mobile: Full functionality verification
- Samsung Internet: Component rendering verification

## Manual Test Checklist

### Core Functionality
- [ ] Category selection displays two clear options
- [ ] System category shows only system roles
- [ ] Organization category shows only organization roles
- [ ] Step navigation works smoothly
- [ ] Back navigation preserves appropriate state
- [ ] Category switching clears incompatible selections
- [ ] Form validation works across steps
- [ ] Organization selector appears only for org roles
- [ ] Form submission completes successfully
- [ ] Email invitations sent correctly

### User Experience
- [ ] Step progression feels natural and intuitive
- [ ] Loading states provide adequate feedback
- [ ] Error messages are clear and actionable
- [ ] Mobile interface is touch-friendly
- [ ] Keyboard navigation works throughout
- [ ] Visual design is consistent and polished

### Technical Integration
- [ ] TanStack Form integration works correctly
- [ ] API calls execute as expected
- [ ] Database updates reflect hierarchical selections
- [ ] Component state management is stable
- [ ] No console errors or warnings
- [ ] Performance targets are met

## Success Criteria
✅ Two-step hierarchical selection replaces side-by-side interface  
✅ Mutually exclusive role display based on category selection  
✅ Smooth navigation between steps with proper state management  
✅ Maintains all existing functionality with improved UX  
✅ Form validation works correctly across step boundaries  
✅ Mobile-optimized interface with touch-friendly navigation  
✅ Accessibility compliant with screen reader support  
✅ Performance meets target response times (<200ms interactions)  
✅ Integration with existing authentication and email systems  
✅ Comprehensive error handling and recovery options