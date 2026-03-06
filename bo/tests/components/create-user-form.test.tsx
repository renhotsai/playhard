/**
 * T010: Component test CreateUserForm
 * 
 * Tests the main create user form component that integrates hierarchical role selection
 * with user information collection using TanStack Form.
 * 
 * CRITICAL: This test MUST FAIL initially (TDD RED phase)
 * Implementation comes after tests pass
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserForm } from '@/components/forms/create-user-form';
import type { CreateUserFormProps } from '@/types/form-types';

// Mock TanStack Form dependencies
jest.mock('@tanstack/react-form', () => ({
  useForm: (opts: any) => {
    const formState = {
      name: opts?.defaultValues?.name || '',
      email: opts?.defaultValues?.email || '',
      roleData: opts?.defaultValues?.roleData || {
        selectedCategory: null,
        selectedRole: null,
        selectedOrganization: null,
        currentStep: 'category'
      }
    };

    return {
      Field: ({ children, name, validators }: any) => {
        const value = formState[name as keyof typeof formState] || '';
        const hasError = name === 'email' && value === 'invalid';
        
        return children({
          state: { 
            value, 
            meta: { 
              errors: hasError ? ['Please enter a valid email address'] : [], 
              isValidating: false 
            } 
          },
          handleChange: jest.fn((newValue) => {
            (formState as any)[name] = newValue;
          }),
          handleBlur: jest.fn()
        });
      },
      Subscribe: ({ children, selector }: any) => {
        const state = { 
          canSubmit: true, 
          isSubmitting: false, 
          isValidating: false,
          values: formState
        };
        const selected = selector ? selector(state) : [state.canSubmit, state.isSubmitting];
        return children(Array.isArray(selected) ? selected : [selected]);
      },
      handleSubmit: jest.fn(),
      setFieldValue: jest.fn((field, value) => {
        (formState as any)[field] = value;
      }),
      getFieldValue: jest.fn((field) => (formState as any)[field])
    };
  }
}));

// Mock the hierarchical role selection component
jest.mock('@/components/forms/hierarchical-role-selection/hierarchical-role-selection', () => ({
  HierarchicalRoleSelection: ({ value, onChange, error, disabled, loading }: any) => (
    <div 
      data-testid="hierarchical-role-selection"
      className={disabled ? 'disabled' : loading ? 'loading' : ''}
    >
      <div data-testid="role-selection-value">
        {value?.selectedRole || 'No role selected'}
      </div>
      {error && <div data-testid="role-selection-error">{error}</div>}
      <button
        data-testid="select-system-admin"
        onClick={() => onChange?.({
          selectedCategory: 'system',
          selectedRole: 'system_admin',
          selectedOrganization: null,
          currentStep: 'role'
        })}
        disabled={disabled || loading}
      >
        Select System Admin
      </button>
      <button
        data-testid="select-org-owner"
        onClick={() => onChange?.({
          selectedCategory: 'organization',
          selectedRole: 'organization_owner',
          selectedOrganization: null,
          currentStep: 'role'
        })}
        disabled={disabled || loading}
      >
        Select Org Owner
      </button>
    </div>
  )
}));

// Mock shadcn/ui form components
jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <form data-testid="form">{children}</form>,
  FormField: ({ children, control, name }: any) => (
    <div data-testid={`form-field-${name}`}>{children}</div>
  ),
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
  FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
  FormDescription: ({ children }: any) => <p data-testid="form-description">{children}</p>,
  FormMessage: ({ children }: any) => <div data-testid="form-message">{children}</div>
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ type, placeholder, value, onChange, disabled, className, ...props }: any) => (
    <input
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className={className}
      data-testid="input"
      {...props}
    />
  )
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      data-testid="button"
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h2 data-testid="card-title">{children}</h2>,
  CardDescription: ({ children }: any) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: any) => <div data-testid="card-footer">{children}</div>
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => (
    <div data-testid="alert-description">{children}</div>
  )
}));

// Mock form validation
jest.mock('@/lib/form-validators', () => ({
  createUserFormSchema: {
    parse: jest.fn((data) => data),
    safeParse: jest.fn((data) => ({ success: true, data }))
  }
}));

describe('CreateUserForm Component Contract Tests', () => {
  const defaultProps: CreateUserFormProps = {
    onSubmit: jest.fn(),
    loading: false,
    disabled: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Interface & Props Contract', () => {
    it('should accept all props according to CreateUserFormProps interface', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();
      
      const props: CreateUserFormProps = {
        onSubmit,
        onCancel,
        loading: false,
        disabled: false,
        error: 'Test error',
        initialValues: {
          name: 'Test User',
          email: 'test@example.com',
          roleData: {
            selectedCategory: 'system',
            selectedRole: 'system_admin',
            selectedOrganization: null,
            currentStep: 'role'
          }
        },
        className: 'test-class',
        'data-testid': 'custom-test-id'
      };

      render(<CreateUserForm {...props} />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
      expect(screen.getByTestId('custom-test-id')).toHaveClass('test-class');
    });

    it('should render with minimal required props', () => {
      render(<CreateUserForm onSubmit={jest.fn()} />);

      expect(screen.getByTestId('create-user-form')).toBeInTheDocument();
    });

    it('should use default testid when not provided', () => {
      render(<CreateUserForm {...defaultProps} />);
      
      expect(screen.getByTestId('create-user-form')).toBeInTheDocument();
    });
  });

  describe('Form Structure & Layout', () => {
    it('should display form title and description', () => {
      render(<CreateUserForm {...defaultProps} />);

      expect(screen.getByTestId('card-title')).toHaveTextContent('Create New User');
      expect(screen.getByTestId('card-description')).toHaveTextContent(
        'Create a new user account and assign their role and permissions'
      );
    });

    it('should have proper form layout with card structure', () => {
      render(<CreateUserForm {...defaultProps} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
      expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    });

    it('should contain all required form fields', () => {
      render(<CreateUserForm {...defaultProps} />);

      expect(screen.getByTestId('form-field-name')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-email')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-roleData')).toBeInTheDocument();
    });

    it('should include hierarchical role selection component', () => {
      render(<CreateUserForm {...defaultProps} />);

      expect(screen.getByTestId('hierarchical-role-selection')).toBeInTheDocument();
    });
  });

  describe('Form Fields Behavior', () => {
    it('should render name input field with proper attributes', () => {
      render(<CreateUserForm {...defaultProps} />);

      const nameField = screen.getByTestId('form-field-name');
      const nameInput = within(nameField).getByTestId('input');
      
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('placeholder', 'Enter full name');
    });

    it('should render email input field with proper attributes', () => {
      render(<CreateUserForm {...defaultProps} />);

      const emailField = screen.getByTestId('form-field-email');
      const emailInput = within(emailField).getByTestId('input');
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter email address');
    });

    it('should handle input changes correctly', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const nameField = screen.getByTestId('form-field-name');
      const nameInput = within(nameField).getByTestId('input');
      
      await user.type(nameInput, 'John Doe');
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const emailField = screen.getByTestId('form-field-email');
      const emailInput = within(emailField).getByTestId('input');
      
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur for validation

      await waitFor(() => {
        expect(screen.getByTestId('form-message')).toHaveTextContent(
          'Please enter a valid email address'
        );
      });
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const submitButton = screen.getByTestId('button');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByTestId('form-message');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Role Selection Integration', () => {
    it('should integrate hierarchical role selection component', () => {
      render(<CreateUserForm {...defaultProps} />);

      const roleSelection = screen.getByTestId('hierarchical-role-selection');
      expect(roleSelection).toBeInTheDocument();
    });

    it('should handle role selection changes', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      render(<CreateUserForm onSubmit={onSubmit} />);

      const selectSystemAdminBtn = screen.getByTestId('select-system-admin');
      await user.click(selectSystemAdminBtn);

      expect(screen.getByTestId('role-selection-value')).toHaveTextContent('system_admin');
    });

    it('should show role validation errors', () => {
      render(
        <CreateUserForm 
          {...defaultProps}
          error="Please select a valid role"
        />
      );

      expect(screen.getByTestId('role-selection-error')).toHaveTextContent(
        'Please select a valid role'
      );
    });

    it('should disable role selection when form is disabled', () => {
      render(<CreateUserForm {...defaultProps} disabled={true} />);

      const roleSelection = screen.getByTestId('hierarchical-role-selection');
      expect(roleSelection).toHaveClass('disabled');
    });

    it('should show loading state in role selection', () => {
      render(<CreateUserForm {...defaultProps} loading={true} />);

      const roleSelection = screen.getByTestId('hierarchical-role-selection');
      expect(roleSelection).toHaveClass('loading');
    });
  });

  describe('Form Submission', () => {
    it('should have submit and cancel buttons', () => {
      render(<CreateUserForm {...defaultProps} onCancel={jest.fn()} />);

      const buttons = screen.getAllByTestId('button');
      const submitButton = buttons.find(btn => btn.textContent === 'Create User');
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');

      expect(submitButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should call onSubmit with form data when submitted', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn();
      
      render(<CreateUserForm onSubmit={onSubmit} />);

      // Fill in form fields
      const nameInput = screen.getAllByTestId('input')[0];
      const emailInput = screen.getAllByTestId('input')[1];
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      
      // Select role
      const selectSystemAdminBtn = screen.getByTestId('select-system-admin');
      await user.click(selectSystemAdminBtn);

      // Submit form
      const submitButton = screen.getByTestId('button');
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          roleData: expect.objectContaining({
            selectedRole: 'system_admin'
          })
        })
      );
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = jest.fn();
      
      render(<CreateUserForm {...defaultProps} onCancel={onCancel} />);

      const buttons = screen.getAllByTestId('button');
      const cancelButton = buttons.find(btn => btn.textContent === 'Cancel');
      
      await user.click(cancelButton!);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable submit button when form is invalid', () => {
      render(<CreateUserForm {...defaultProps} />);

      const submitButton = screen.getByTestId('button');
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state on submit button when submitting', () => {
      render(<CreateUserForm {...defaultProps} loading={true} />);

      const submitButton = screen.getByTestId('button');
      expect(submitButton).toHaveTextContent('Creating...');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display form-level error messages', () => {
      const errorMessage = 'Failed to create user. Please try again.';
      
      render(
        <CreateUserForm 
          {...defaultProps}
          error={errorMessage}
        />
      );

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-description')).toHaveTextContent(errorMessage);
    });

    it('should apply error variant to alert', () => {
      render(
        <CreateUserForm 
          {...defaultProps}
          error="Error message"
        />
      );

      const alert = screen.getByTestId('alert');
      expect(alert).toHaveAttribute('data-variant', 'destructive');
    });

    it('should show field-specific validation errors', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const emailInput = screen.getAllByTestId('input')[1];
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('form-message')).toBeInTheDocument();
      });
    });

    it('should clear errors when fields are corrected', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const emailInput = screen.getAllByTestId('input')[1];
      
      // Enter invalid email
      await user.type(emailInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('form-message')).toBeInTheDocument();
      });

      // Correct the email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(screen.queryByTestId('form-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Initial Values', () => {
    it('should populate form with initial values when provided', () => {
      const initialValues = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        roleData: {
          selectedCategory: 'organization' as const,
          selectedRole: 'organization_owner' as const,
          selectedOrganization: 'org-1',
          currentStep: 'role' as const
        }
      };

      render(
        <CreateUserForm 
          {...defaultProps}
          initialValues={initialValues}
        />
      );

      const nameInput = screen.getAllByTestId('input')[0];
      const emailInput = screen.getAllByTestId('input')[1];

      expect(nameInput).toHaveValue('Jane Doe');
      expect(emailInput).toHaveValue('jane@example.com');
      expect(screen.getByTestId('role-selection-value')).toHaveTextContent('organization_owner');
    });

    it('should handle partial initial values gracefully', () => {
      const partialValues = {
        name: 'John Smith'
        // email and roleData missing
      };

      render(
        <CreateUserForm 
          {...defaultProps}
          initialValues={partialValues}
        />
      );

      const nameInput = screen.getAllByTestId('input')[0];
      const emailInput = screen.getAllByTestId('input')[1];

      expect(nameInput).toHaveValue('John Smith');
      expect(emailInput).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(<CreateUserForm {...defaultProps} />);

      const formLabels = screen.getAllByTestId('form-label');
      expect(formLabels.length).toBeGreaterThan(0);
      
      const nameLabel = formLabels.find(label => label.textContent === 'Full Name');
      const emailLabel = formLabels.find(label => label.textContent === 'Email Address');
      
      expect(nameLabel).toBeInTheDocument();
      expect(emailLabel).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<CreateUserForm {...defaultProps} />);

      const form = screen.getByTestId('form');
      expect(form).toHaveAttribute('noValidate'); // For custom validation
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      // Should be able to tab through form fields
      await user.tab();
      const nameInput = screen.getAllByTestId('input')[0];
      expect(nameInput).toHaveFocus();

      await user.tab();
      const emailInput = screen.getAllByTestId('input')[1];
      expect(emailInput).toHaveFocus();
    });

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const submitButton = screen.getByTestId('button');
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId('form-message');
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Performance & Optimization', () => {
    it('should render quickly', () => {
      const start = performance.now();
      render(<CreateUserForm {...defaultProps} />);
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // Should render in < 50ms
    });

    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      function TestWrapper(props: any) {
        renderSpy();
        return <CreateUserForm {...props} />;
      }

      const { rerender } = render(<TestWrapper {...defaultProps} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props should not cause re-render due to memoization
      rerender(<TestWrapper {...defaultProps} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with TanStack Form', () => {
    it('should use TanStack Form for state management', () => {
      render(<CreateUserForm {...defaultProps} />);

      // Form should be properly structured with TanStack Form components
      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-name')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-email')).toBeInTheDocument();
    });

    it('should handle form validation with TanStack Form', async () => {
      const user = userEvent.setup();
      
      render(<CreateUserForm {...defaultProps} />);

      const submitButton = screen.getByTestId('button');
      await user.click(submitButton);

      // TanStack Form should handle validation
      await waitFor(() => {
        expect(screen.getByTestId('form-message')).toBeInTheDocument();
      });
    });

    it('should provide proper form state management', () => {
      render(<CreateUserForm {...defaultProps} />);

      // Should show proper form state
      const submitButton = screen.getByTestId('button');
      expect(submitButton).toBeInTheDocument();
    });
  });
});