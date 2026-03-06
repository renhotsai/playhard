/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PermissionMatrix, type PermissionMatrix as PermissionMatrixType } from '@/components/permissions'

// Mock the Checkbox and Button components
jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid={props['data-testid']}
      {...props}
    />
  )
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ onClick, children, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}))

jest.mock('@/components/ui/loading-state', () => ({
  LoadingState: ({ message }: { message?: string }) => <div data-testid="loading">{message || 'Loading...'}</div>
}))

describe('PermissionMatrix Component', () => {
  const mockPermissions: PermissionMatrixType[] = [
    {
      resource: 'users',
      permissions: {
        create: true,
        read: true,
        update: false,
        delete: false,
        all: false
      },
      all: false
    },
    {
      resource: 'organizations',
      permissions: {
        create: false,
        read: true,
        update: true,
        delete: false,
        all: false
      },
      all: false
    }
  ]

  const mockOnChange = jest.fn()
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders permission matrix with correct structure', () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    // Check if the table structure is rendered
    expect(screen.getByRole('table')).toBeInTheDocument()
    
    // Check if resource rows are rendered
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Organizations')).toBeInTheDocument()
    
    // Check if action columns are rendered
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('Update')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Read')).toBeInTheDocument()
  })

  it('displays correct checkbox states', () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    // Check users resource permissions
    const usersCreateCheckbox = screen.getByTestId('checkbox-users-create')
    expect(usersCreateCheckbox).toBeChecked()
    
    const usersReadCheckbox = screen.getByTestId('checkbox-users-read')
    expect(usersReadCheckbox).toBeChecked()
    
    const usersUpdateCheckbox = screen.getByTestId('checkbox-users-update')
    expect(usersUpdateCheckbox).not.toBeChecked()
    
    const usersDeleteCheckbox = screen.getByTestId('checkbox-users-delete')
    expect(usersDeleteCheckbox).not.toBeChecked()

    // Check organizations resource permissions
    const orgsCreateCheckbox = screen.getByTestId('checkbox-organizations-create')
    expect(orgsCreateCheckbox).not.toBeChecked()
    
    const orgsReadCheckbox = screen.getByTestId('checkbox-organizations-read')
    expect(orgsReadCheckbox).toBeChecked()
    
    const orgsUpdateCheckbox = screen.getByTestId('checkbox-organizations-update')
    expect(orgsUpdateCheckbox).toBeChecked()
  })

  it('handles individual permission changes correctly', async () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    // Click on users update checkbox (currently false)
    const usersUpdateCheckbox = screen.getByTestId('checkbox-users-update')
    fireEvent.click(usersUpdateCheckbox)

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            resource: 'users',
            permissions: expect.objectContaining({
              create: true,
              read: true,
              update: true, // Changed to true
              delete: false,
            })
          })
        ])
      )
    })
  })

  it('handles "All" checkbox logic correctly', async () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    // Click on users "all" checkbox
    const usersAllCheckbox = screen.getByTestId('checkbox-users-all')
    fireEvent.click(usersAllCheckbox)

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            resource: 'users',
            permissions: expect.objectContaining({
              create: true,
              read: true,
              update: true, // Should be set to true when "all" is checked
              delete: true, // Should be set to true when "all" is checked
              all: true
            }),
            all: true
          })
        ])
      )
    })
  })

  it('shows loading state when loading prop is true', () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
        loading={true}
      />
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('disables all controls when disabled prop is true', () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
        disabled={true}
      />
    )

    // All checkboxes should be disabled
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled()
    })

    // Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })

  it('calls onSave when save button is clicked', async () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(mockOnSave).toHaveBeenCalledTimes(1)
  })

  it('initializes missing resources with default permissions', () => {
    const incompletePermissions: PermissionMatrixType[] = [
      {
        resource: 'users',
        permissions: {
          create: true,
          read: true,
          update: false,
          delete: false,
          all: false
        },
        all: false
      }
    ]

    render(
      <PermissionMatrix
        permissions={incompletePermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    // Should have called onChange to initialize missing resources
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          resource: 'users'
        }),
        expect.objectContaining({
          resource: 'teams',
          permissions: expect.objectContaining({
            create: false,
            read: false,
            update: false,
            delete: false,
            all: false
          })
        }),
        expect.objectContaining({
          resource: 'organizations'
        })
        // Should include all required resources
      ])
    )
  })

  it('handles read dependency logic correctly', async () => {
    render(
      <PermissionMatrix
        permissions={mockPermissions}
        onChange={mockOnChange}
        onSave={mockOnSave}
      />
    )

    // Click on users create checkbox (read should automatically be checked)
    const usersDeleteCheckbox = screen.getByTestId('checkbox-users-delete')
    fireEvent.click(usersDeleteCheckbox)

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            resource: 'users',
            permissions: expect.objectContaining({
              create: true,
              read: true, // Should remain true (dependency)
              update: false,
              delete: true, // Changed to true
            })
          })
        ])
      )
    })
  })
})