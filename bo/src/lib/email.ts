import { Resend } from 'resend';
import { promises as fs } from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

// Role type definitions for Better Auth integration
export type UserRole = 'system-admin' | 'organization-owner' | 'organization-admin' | 'game-master' | 'game-staff' | 'game-player';

// Email template data interface
export interface EmailTemplateData {
  recipientName: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
  organizationName?: string;
  inviterName?: string;
  role?: UserRole;
}

// Email send result interface
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  developmentMode?: boolean;
  emailAddress: string;
}

// Template file mapping for role-specific emails
const ROLE_TEMPLATE_MAPPING: Record<UserRole, string> = {
  'system-admin': 'system-admin.html',
  'organization-owner': 'organization-owner.html', 
  'organization-admin': 'organization-admin.html',
  'game-master': 'game-master.html',
  'game-staff': 'game-staff.html',
  'game-player': 'game-player.html'
};

// Template subject mapping for role-specific subjects
const ROLE_SUBJECT_MAPPING: Record<UserRole, string> = {
  'system-admin': '🔑 您的 PlayHard 系統管理員邀請 - 最高權限啟動',
  'organization-owner': '🏢 您的 PlayHard 組織負責人邀請 - 開始管理您的門店',
  'organization-admin': '⚙️ 您的 PlayHard 組織管理員邀請 - 協助營運管理',
  'game-master': '🎭 您的 PlayHard 遊戲主持人邀請 - 成為故事引導者',
  'game-staff': '🤝 您的 PlayHard 工作人員邀請 - 提供專業服務',
  'game-player': '🎮 您的 PlayHard 玩家邀請 - 開啟推理冒險'
};

// Default fallback HTML template for magic link invitation (kept for backwards compatibility)
const FALLBACK_MAGIC_LINK_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlayHard 帳戶邀請</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #333;
            margin-top: 0;
            font-size: 22px;
            font-weight: 600;
        }
        .content p {
            margin-bottom: 20px;
            font-size: 16px;
            color: #555;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .cta-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-1px);
        }
        .warning-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
            font-weight: 500;
        }
        .link-fallback {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        .link-fallback p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }
        .link-text {
            background: #e9ecef;
            padding: 8px;
            border-radius: 4px;
            word-break: break-all;
            font-family: monospace;
            font-size: 13px;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            padding: 20px;
            background: #f8f9fa;
        }
        .footer p {
            margin: 5px 0;
        }
        .logo {
            display: inline-block;
            background: white;
            padding: 8px 16px;
            border-radius: 6px;
            margin-bottom: 10px;
        }
        .logo-text {
            color: #667eea;
            font-weight: 700;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <span class="logo-text">PlayHard</span>
            </div>
            <h1>歡迎加入管理系統</h1>
        </div>
        
        <div class="content">
            <h2>您已被邀請加入 PlayHard 後台系統</h2>
            <p>親愛的用戶，您好！</p>
            <p>恭喜您被邀請加入 PlayHard 後台管理系統。我們很高興您能成為團隊的一員！</p>
            <p>請點擊下方按鈕來完成您的帳戶設定，並開始使用系統。</p>
            
            <div class="button-container">
                <a href="{{magicLinkUrl}}" class="cta-button">
                    ✨ 完成帳戶設定
                </a>
            </div>
            
            <div class="warning-box">
                <p>
                    <strong>⏰ 重要提醒：</strong>此邀請連結將在 <strong>{{expiresInMinutes}} 分鐘</strong>後失效，請盡快完成設定。
                </p>
            </div>
            
            <div class="link-fallback">
                <p style="margin-bottom: 10px;"><strong>無法點擊按鈕？</strong></p>
                <p>請複製以下連結到您的瀏覽器中：</p>
                <div class="link-text">{{magicLinkUrl}}</div>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #777;">
                如果您不是預期收到此邀請的人，請忽略此郵件或聯繫我們的技術支援。
            </p>
        </div>
        
        <div class="footer">
            <p><strong>PlayHard 劇本殺管理系統</strong></p>
            <p>此郵件由系統自動發送，請勿直接回覆。</p>
            <p style="margin-top: 10px; color: #999;">© 2024 PlayHard. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

/**
 * Load email template from file system
 */
async function loadEmailTemplate(templateName: string): Promise<string> {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', templateName);
    const template = await fs.readFile(templatePath, 'utf-8');
    return template;
  } catch (error) {
    console.warn(`[EMAIL TEMPLATE] Could not load template ${templateName}, using fallback`);
    return FALLBACK_MAGIC_LINK_TEMPLATE;
  }
}

/**
 * Replace placeholders in email template
 */
function replacePlaceholders(template: string, data: EmailTemplateData): string {
  return template
    .replace(/{{recipientName}}/g, data.recipientName)
    .replace(/{{magicLinkUrl}}/g, data.magicLinkUrl)
    .replace(/{{expiresInMinutes}}/g, String(data.expiresInMinutes))
    .replace(/{{organizationName}}/g, data.organizationName || 'PlayHard 平台')
    .replace(/{{inviterName}}/g, data.inviterName || 'PlayHard 團隊');
}

/**
 * Generate text version of email from HTML
 */
function generateTextVersion(data: EmailTemplateData): string {
  const roleMessages: Record<UserRole, string> = {
    'system-admin': '您已被邀請成為 PlayHard 系統管理員！您將擁有平台的完整管理權限。',
    'organization-owner': `您已被邀請成為 ${data.organizationName} 的組織負責人！您將負責管理整個組織的營運。`,
    'organization-admin': `您已被邀請成為 ${data.organizationName} 的組織管理員！您將協助日常營運管理工作。`,
    'game-master': `您已被邀請成為 ${data.organizationName} 的遊戲主持人！您將引導玩家進行精彩的劇本殺體驗。`,
    'game-staff': `您已被邀請成為 ${data.organizationName} 的工作人員！您將提供專業的遊戲支援服務。`,
    'game-player': `您已被邀請成為 ${data.organizationName} 的遊戲玩家！準備享受精彩的推理冒險吧！`
  };
  
  const roleMessage = data.role ? roleMessages[data.role] : '您已被邀請加入 PlayHard 劇本殺平台！';
  
  return `歡迎加入 PlayHard 劇本殺平台！

親愛的 ${data.recipientName}，

${roleMessage}

請點擊以下連結完成帳戶設定: ${data.magicLinkUrl}

此連結將在 ${data.expiresInMinutes} 分鐘後失效。

如有任何問題，歡迎聯絡我們的客戶服務。

PlayHard 團隊`;
}

/**
 * Send role-based email with template system
 */
async function sendActualRoleBasedEmail(templateData: {
  email: string;
  magicLinkUrl: string;
  recipientName: string;
  role?: UserRole;
  organizationName?: string;
  inviterName?: string;
  expiresInMinutes: number;
}): Promise<EmailSendResult> {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const emailTemplateData: EmailTemplateData = {
    recipientName: templateData.recipientName,
    magicLinkUrl: templateData.magicLinkUrl,
    expiresInMinutes: templateData.expiresInMinutes,
    organizationName: templateData.organizationName,
    inviterName: templateData.inviterName,
    role: templateData.role
  };
  
  // Load appropriate template based on role
  let htmlTemplate: string;
  let subject: string;
  
  if (templateData.role && ROLE_TEMPLATE_MAPPING[templateData.role]) {
    console.log(`[EMAIL TEMPLATE] Loading role-specific template for: ${templateData.role}`);
    htmlTemplate = await loadEmailTemplate(ROLE_TEMPLATE_MAPPING[templateData.role]);
    subject = ROLE_SUBJECT_MAPPING[templateData.role];
  } else {
    console.log('[EMAIL TEMPLATE] Using fallback template');
    htmlTemplate = FALLBACK_MAGIC_LINK_TEMPLATE;
    subject = '🎭 您的 PlayHard 帳戶邀請 - 請完成設定';
  }
  
  // Replace placeholders in template
  const processedHtml = replacePlaceholders(htmlTemplate, emailTemplateData);
  const textContent = generateTextVersion(emailTemplateData);
  
  const emailPayload = {
    from: 'PlayHard Admin <onboarding@resend.dev>',
    to: [templateData.email],
    subject,
    html: processedHtml,
    text: textContent
  };
  
  if (isDevelopment) {
    console.log('[EMAIL DEBUG] Enhanced email payload:', JSON.stringify({
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      role: templateData.role,
      organization: templateData.organizationName,
      textLength: emailPayload.text.length,
      htmlLength: emailPayload.html.length
    }, null, 2));
  }
  
  const { data: sendData, error } = await resend.emails.send(emailPayload);
  
  if (error) {
    console.error('[EMAIL ERROR] Resend API error:', error);
    return {
      success: false,
      error: `Failed to send invitation email: ${JSON.stringify(error)}`,
      emailAddress: templateData.email
    };
  }
  
  console.log('[EMAIL SUCCESS] Enhanced email sent with ID:', sendData?.id);
  return {
    success: true,
    messageId: sendData?.id,
    emailAddress: templateData.email
  };
}

/**
 * Legacy function for backwards compatibility
 */
async function sendActualEmail(email: string, magicLinkUrl: string): Promise<void> {
  const result = await sendActualRoleBasedEmail({
    email,
    magicLinkUrl,
    recipientName: '用戶',
    expiresInMinutes: 15
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }
}

/**
 * Enhanced magic link email sender with role-specific templates
 * Works seamlessly with Better Auth's magic link system
 */
export async function sendMagicLinkEmail(
  data: { 
    email: string; 
    url: string; 
    token: string;
    // Enhanced data for role-specific emails
    recipientName?: string;
    role?: UserRole;
    organizationName?: string;
    inviterName?: string;
  }
): Promise<EmailSendResult> {
  try {
    const { 
      email, 
      url: magicLinkUrl, 
      token, 
      recipientName = '用戶',
      role,
      organizationName,
      inviterName 
    } = data;
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    console.log(`[EMAIL DEBUG] Starting enhanced email send to: ${email}`);
    console.log(`[EMAIL DEBUG] Role: ${role || 'generic'}`);
    console.log(`[EMAIL DEBUG] Organization: ${organizationName || 'N/A'}`);
    console.log(`[EMAIL DEBUG] Magic link URL: ${magicLinkUrl}`);
    console.log(`[EMAIL DEBUG] Token: ${token.substring(0, 10)}...`);
    console.log(`[EMAIL DEBUG] Environment: ${process.env.NODE_ENV}`);
    console.log(`[EMAIL DEBUG] Resend API key present: ${!!process.env.RESEND_API_KEY}`);
    
    // Development Mode: Display magic link URL in console for testing
    if (isDevelopment) {
      console.log('\n' + '='.repeat(80));
      console.log(`🧪 DEVELOPMENT MODE - ${role ? `${role.toUpperCase()} ` : ''}MAGIC LINK EMAIL MOCK`);
      console.log('='.repeat(80));
      console.log(`📧 To: ${email}`);
      console.log(`👤 Recipient: ${recipientName}`);
      console.log(`🎭 Role: ${role || 'generic'}`);
      console.log(`🏢 Organization: ${organizationName || 'N/A'}`);
      console.log(`🔗 Magic Link URL: ${magicLinkUrl}`);
      console.log(`🎫 Token: ${token}`);
      console.log('📋 Copy and paste the URL above into your browser to test the magic link');
      console.log('⏰ Link expires in 15 minutes');
      console.log('='.repeat(80) + '\n');
      
      // In development, only try to send email to verified addresses
      const canSendRealEmail = email.toLowerCase() === 'renhotsai@gmail.com';
      
      if (canSendRealEmail) {
        try {
          const result = await sendActualRoleBasedEmail({
            email,
            magicLinkUrl,
            recipientName,
            role,
            organizationName,
            inviterName,
            expiresInMinutes: 15
          });
          console.log('[EMAIL SUCCESS] Real email sent successfully in development mode');
          return result;
        } catch (devEmailError) {
          console.log('[EMAIL MOCK] Real email failed (using console display instead):', devEmailError instanceof Error ? devEmailError.message : String(devEmailError));
          return {
            success: true,
            developmentMode: true,
            emailAddress: email
          };
        }
      } else {
        console.log('[EMAIL MOCK] Skipping real email for non-verified address in development mode');
        console.log('✅ Magic link is available above for testing');
        return {
          success: true,
          developmentMode: true,
          emailAddress: email
        };
      }
    }
    
    // Production Mode: Send actual email and fail if it doesn't work
    const result = await sendActualRoleBasedEmail({
      email,
      magicLinkUrl,
      recipientName,
      role,
      organizationName,
      inviterName,
      expiresInMinutes: 15
    });
    
    console.log('[EMAIL SUCCESS] Magic link email sent successfully in production');
    return result;
    
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      console.log('[EMAIL MOCK] Using console display for development testing');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        developmentMode: true,
        emailAddress: data.email
      };
    }
    
    console.error('[EMAIL ERROR] Production email failed:', error);
    throw error;
  }
}

/**
 * Send role-specific invitation email - Main API function
 * This is the primary function for sending role-specific invitations
 */
export async function sendRoleBasedInvitationEmail(data: {
  email: string;
  magicLinkUrl: string;
  recipientName: string;
  role: UserRole;
  organizationName?: string;
  inviterName?: string;
  expiresInMinutes?: number;
}): Promise<EmailSendResult> {
  return await sendActualRoleBasedEmail({
    email: data.email,
    magicLinkUrl: data.magicLinkUrl,
    recipientName: data.recipientName,
    role: data.role,
    organizationName: data.organizationName,
    inviterName: data.inviterName,
    expiresInMinutes: data.expiresInMinutes || 15
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<EmailSendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'PlayHard Admin <admin@playhard.local>',
      to: [email],
      subject: '🔒 PlayHard 密碼重設',
      html: `
        <h1>密碼重設請求</h1>
        <p>您好！我們收到您的密碼重設請求。</p>
        <p><a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">重設密碼</a></p>
        <p>如果您沒有要求重設密碼，請忽略此郵件。</p>
      `,
      text: `密碼重設請求\n\n請點擊以下連結重設您的密碼: ${resetUrl}\n\n如果您沒有要求重設密碼，請忽略此郵件。`
    });
    
    if (error) {
      console.error('Password reset email error:', error);
      return {
        success: false,
        error: 'Failed to send password reset email',
        emailAddress: email
      };
    }
    
    console.log('[EMAIL SUCCESS] Password reset email sent with ID:', data?.id);
    return {
      success: true,
      messageId: data?.id,
      emailAddress: email
    };
  } catch (error) {
    console.error('Password reset email error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      emailAddress: email
    };
  }
}

/**
 * Get available email templates
 */
export function getAvailableEmailTemplates(): Record<UserRole, string> {
  return ROLE_TEMPLATE_MAPPING;
}

/**
 * Get email subject for role
 */
export function getEmailSubjectForRole(role: UserRole): string {
  return ROLE_SUBJECT_MAPPING[role] || '🎭 您的 PlayHard 帳戶邀請';
}