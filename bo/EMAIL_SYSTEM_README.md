# PlayHard Email Invitation System

## Overview

A comprehensive email invitation system with role-specific templates for the PlayHard murder mystery platform. This system integrates seamlessly with Better Auth's magic link system to provide beautiful, role-specific invitation emails for all user types.

## ✨ Features

### 🎭 Role-Specific Templates
- **System Admin**: High-authority red theme with crown icon
- **Organization Owner**: Professional purple theme with business focus
- **Organization Admin**: Green theme emphasizing operational support
- **Game Master**: Golden theme celebrating storytelling and hosting
- **Game Staff**: Cyan theme highlighting service and teamwork
- **Game Player**: Pink theme focusing on adventure and mystery

### 🔧 Technical Features
- **Better Auth Integration**: Works seamlessly with magic link plugin
- **Resend Email Provider**: Professional email delivery service
- **Development Mode**: Console display for easy testing
- **Template Management**: File-based HTML template system
- **Error Handling**: Comprehensive error handling and retry logic
- **Mobile Responsive**: All templates work perfectly on mobile devices

### 🎨 Email Template Features
- Murder mystery gaming theme and branding
- Role-specific icons, colors, and messaging
- Professional HTML design with fallback text versions
- Security information and expiration details
- Clear call-to-action buttons
- Organization context for business users

## 📁 File Structure

```
src/
├── lib/
│   ├── email.ts                 # Enhanced email service
│   └── auth.ts                  # Better Auth configuration
├── templates/emails/            # Role-specific HTML templates
│   ├── system-admin.html        # System administrator template
│   ├── organization-owner.html  # Organization owner template
│   ├── organization-admin.html  # Organization admin template
│   ├── game-master.html         # Game master template
│   ├── game-staff.html          # Game staff template
│   └── game-player.html         # Game player template
└── app/api/
    └── invite-user/
        └── route.ts             # Enhanced invitation API
```

## 🚀 Usage

### API Endpoint Usage

#### POST /api/invite-user

Send role-specific invitations with enhanced email templates:

```javascript
const response = await fetch('/api/invite-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    role: 'game-master',
    organizationId: 'org_123',
    organizationName: 'Mystery Manor',
    customMessage: 'Welcome to our team!'
  })
});
```

#### GET /api/invite-user

Get available roles and template information:

```javascript
const info = await fetch('/api/invite-user').then(r => r.json());
console.log(info.availableRoles); // ['system-admin', 'organization-owner', ...]
console.log(info.roleInformation); // Role descriptions and subjects
```

### Direct Email Service Usage

```javascript
import { sendRoleBasedInvitationEmail } from '@/lib/email';

const result = await sendRoleBasedInvitationEmail({
  email: 'player@example.com',
  magicLinkUrl: 'https://app.playhard.com/auth/magic-link/xyz',
  recipientName: 'Jane Smith',
  role: 'game-player',
  organizationName: 'Sherlock\'s Den',
  inviterName: 'Game Master',
  expiresInMinutes: 15
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

## 🎯 Role Types

| Role | Description | Template Theme | Use Case |
|------|-------------|----------------|----------|
| `system-admin` | Platform administrator | Red/Crown | Full platform control |
| `organization-owner` | Business owner | Purple/Business | Store management |
| `organization-admin` | Operations manager | Green/Operations | Daily operations |
| `game-master` | Story host | Gold/Performance | Game hosting |
| `game-staff` | Support team | Cyan/Service | Customer service |
| `game-player` | Game participant | Pink/Adventure | Mystery solving |

## ⚙️ Configuration

### Environment Variables

```env
# Required for email functionality
RESEND_API_KEY="re_your_resend_api_key"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000/api/auth"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Development settings
NODE_ENV="development"  # Use "production" for actual email sending
```

### Better Auth Configuration

The system automatically configures Better Auth to use enhanced email templates:

```javascript
// In src/lib/auth.ts
export const auth = betterAuth({
  plugins: [
    magicLink({
      sendMagicLink: async (data) => {
        // Automatically uses role-specific templates
        await sendMagicLinkEmail({
          email: data.email,
          url: data.url,
          token: data.token,
          role: 'system-admin' // Default for direct magic links
        });
      }
    }),
    organization({
      sendInvitationEmail: async (data) => {
        // Organization invitations with role context
        await sendMagicLinkEmail({
          email: data.email,
          url: invitationUrl,
          token: data.invitation.id,
          role: 'organization-owner', // Default for org invitations
          organizationName: data.organization?.name
        });
      }
    })
  ]
});
```

## 🧪 Testing

### Development Mode

In development mode, emails are displayed in the console instead of being sent:

```bash
npm run dev
```

Test the system by visiting: `http://localhost:3000/api/invite-user`

### Email Template Testing

```bash
# Run the test script
node scripts/test-email-templates.js
```

This will test all role-specific templates and display the results in console.

### Production Testing

For production email testing, use verified email addresses with Resend:

```javascript
// Only these emails will receive actual emails in development
const verifiedEmails = ['your-verified@email.com'];
```

## 📧 Email Flow

### 1. System Admin Creation
```
Admin creates user → Better Auth user creation → Magic link generation → 
System admin email template → Resend delivery → User receives email →
Click link → Auto-login → Dashboard
```

### 2. Organization Member Invitation
```
Owner invites member → Better Auth user + organization invitation → 
Role-specific email template → Resend delivery → User receives email →
Click link → Accept invitation → Auto-login → Set username → Dashboard
```

### 3. Magic Link Authentication
```
User requests magic link → Better Auth magic link generation →
Role-specific template (system-admin default) → Resend delivery →
User clicks link → Auto-login → Dashboard
```

## 🎨 Customization

### Adding New Roles

1. **Add role to type definition**:
```javascript
// In src/lib/email.ts
export type UserRole = 'system-admin' | 'your-new-role' | ...;
```

2. **Create HTML template**:
```html
<!-- src/templates/emails/your-new-role.html -->
<!DOCTYPE html>
<html>
<!-- Your custom template -->
</html>
```

3. **Add to mapping**:
```javascript
const ROLE_TEMPLATE_MAPPING = {
  'your-new-role': 'your-new-role.html',
  // ...
};

const ROLE_SUBJECT_MAPPING = {
  'your-new-role': '🎯 Your Custom Role Invitation',
  // ...
};
```

### Template Customization

Each template uses these placeholders:
- `{{recipientName}}` - User's display name
- `{{magicLinkUrl}}` - The magic link URL
- `{{expiresInMinutes}}` - Link expiration time
- `{{organizationName}}` - Organization context
- `{{inviterName}}` - Who sent the invitation

## 🛡️ Security

- **Magic Link Expiration**: 15 minutes by default
- **Better Auth Integration**: Secure token generation
- **Development Safety**: Console display prevents accidental emails
- **Production Verification**: Only verified domains can send emails
- **CSRF Protection**: Better Auth session validation

## 📈 Monitoring

### Email Delivery Tracking

```javascript
const result = await sendRoleBasedInvitationEmail(data);

if (result.success) {
  console.log('Message ID:', result.messageId);
  console.log('Email Address:', result.emailAddress);
} else {
  console.error('Delivery Failed:', result.error);
}
```

### Development Debugging

```bash
# Watch email logs
tail -f logs/email.log

# Check Resend dashboard
https://resend.com/logs
```

## 🚨 Troubleshooting

### Common Issues

1. **Templates not loading**: Check file paths in `src/templates/emails/`
2. **Resend API errors**: Verify API key and domain verification
3. **Development emails not showing**: Check console output
4. **Magic links not working**: Verify Better Auth URL configuration

### Debug Mode

Enable detailed logging:

```javascript
// Set in environment
DEBUG_EMAIL=true npm run dev
```

## 🔄 Integration Examples

### Frontend Usage (React)

```javascript
const InviteUserForm = () => {
  const [result, setResult] = useState(null);

  const handleInvite = async (formData) => {
    const response = await fetch('/api/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    setResult(result);

    if (result.success) {
      alert('Invitation sent successfully!');
    } else {
      alert('Failed to send invitation: ' + result.error);
    }
  };

  return (
    <form onSubmit={handleInvite}>
      {/* Form fields */}
    </form>
  );
};
```

### Backend Integration

```javascript
// Custom invitation logic
export async function inviteTeamMember(userData) {
  try {
    const invitation = await sendRoleBasedInvitationEmail({
      ...userData,
      role: 'game-staff',
      organizationName: 'PlayHard Central'
    });

    if (invitation.success) {
      // Log successful invitation
      await logInvitation(userData.email, invitation.messageId);
    }

    return invitation;
  } catch (error) {
    console.error('Team invitation failed:', error);
    throw error;
  }
}
```

## 📝 License

This email system is part of the PlayHard project and follows the same licensing terms.