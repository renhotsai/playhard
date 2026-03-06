# Tasks Implementation Template

## Agent Consultation Requirements

**MANDATORY**: Before implementing any task, MUST consult with the appropriate specialized agent based on the feature domain:

### Authentication & Authorization
- **Agent**: `better-auth-validator`
- **When to Use**: For ALL authentication-related implementations
- **Examples**:
  - User authentication flows
  - Session management
  - Permission validation
  - Role-based access control
  - Better Auth API integrations
  - Magic link implementations

### UI Components & Styling  
- **Agent**: `shadcn-ui-designer`
- **When to Use**: For ALL UI component implementations
- **Examples**:
  - Form components
  - Button styling
  - Layout components
  - Modal dialogs
  - Data display components
  - shadcn/ui integration

### TanStack Functionality
- **Agent**: `tanstack-expert`
- **When to Use**: For ALL TanStack library implementations
- **Examples**:
  - TanStack Query (server state management)
  - TanStack Form (form state management and validation)
  - TanStack Table (data tables and datagrids)
  - React Query patterns
  - Form validation schemas
  - Table configurations

### Next.js Architecture
- **Agent**: `nextjs-compliance-checker`
- **When to Use**: For project structure and Next.js patterns
- **Examples**:
  - Routing patterns
  - API route implementations
  - Middleware configurations
  - App Router patterns
  - Server components vs client components

## Implementation Process

1. **Identify Domain**: Categorize the task by its primary technology domain
2. **Consult Agent**: Always consult the appropriate agent BEFORE implementing
3. **Follow Guidance**: Implement exactly according to agent recommendations
4. **Validate**: Ensure the implementation follows framework best practices

## Why This Process is Critical

- Prevents architectural coupling issues
- Ensures framework compliance and best practices  
- Reduces debugging time and technical debt
- Maintains consistency across the codebase
- Leverages specialized knowledge for each domain

## Task Template Structure

```markdown
### Task: [Task Name]

**Domain**: [auth/ui/tanstack/nextjs/database]
**Agent Consultation**: [Required agent name]
**Dependencies**: [List of dependent tasks]

**Description**: 
[Clear description of what needs to be implemented]

**Agent Consultation Notes**:
[Notes from consulting with the appropriate agent]

**Implementation**:
[Step-by-step implementation following agent guidance]

**Validation**:
[How to verify the implementation is correct]
```

## Agent Responsibilities

### better-auth-validator
- Validates Better Auth API usage patterns
- Ensures authentication security best practices
- Reviews session management implementations
- Validates role-based access control

### shadcn-ui-designer  
- Creates consistent UI component designs
- Ensures proper shadcn/ui integration
- Validates accessibility patterns
- Reviews component styling approaches

### tanstack-expert
- Validates TanStack library usage patterns
- Ensures optimal query/form/table configurations
- Reviews state management approaches
- Validates performance optimizations

### nextjs-compliance-checker
- Validates Next.js architectural patterns
- Reviews routing and API implementations
- Ensures proper server/client component usage
- Validates middleware configurations