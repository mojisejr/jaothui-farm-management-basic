import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Default values
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@farmmanagement.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'https://localhost:3000'

/**
 * Email template interfaces
 */
export interface PasswordResetEmailData {
  firstName?: string
  phoneNumber: string
  resetLink: string
  expiry: string
}

export interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Generate password reset email HTML template
 */
function generatePasswordResetEmailHTML(data: PasswordResetEmailData): string {
  const { firstName, phoneNumber, resetLink, expiry } = data

  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>รีเซ็ตรหัสผ่าน - ระบบจัดการฟาร์ม</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #059669;
            margin: 0;
            font-size: 28px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h2 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            margin-bottom: 20px;
            font-size: 16px;
        }
        .message {
            margin-bottom: 25px;
            line-height: 1.7;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background-color: #059669;
            color: #ffffff !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .reset-button:hover {
            background-color: #047857;
        }
        .expiry-warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .expiry-warning strong {
            color: #d97706;
        }
        .security-note {
            background-color: #f3f4f6;
            border-left: 4px solid #6b7280;
            padding: 15px;
            margin: 25px 0;
            font-size: 14px;
            color: #4b5563;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .contact-info {
            margin-top: 20px;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .reset-button {
                padding: 12px 25px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🌾 ระบบจัดการฟาร์ม</h1>
        </div>
        
        <div class="header">
            <h2>รีเซ็ตรหัสผ่าน</h2>
        </div>
        
        <div class="content">
            <div class="greeting">
                สวัสดี${firstName ? ` คุณ${firstName}` : ''}
            </div>
            
            <div class="message">
                <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีที่เชื่อมโยงกับเบอร์โทรศัพท์ <strong>${phoneNumber}</strong></p>
                
                <p>หากคุณเป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาคลิกปุ่มด้านล่างเพื่อสร้างรหัสผ่านใหม่:</p>
            </div>
            
            <div class="button-container">
                <a href="${resetLink}" class="reset-button">รีเซ็ตรหัสผ่าน</a>
            </div>
            
            <div class="expiry-warning">
                <strong>⚠️ ลิงก์นี้จะหมดอายุภายใน ${expiry}</strong>
            </div>
            
            <div class="security-note">
                <strong>หมายเหตุด้านความปลอดภัย:</strong><br>
                • หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้<br>
                • อย่าแชร์ลิงก์นี้กับบุคคลอื่น<br>
                • ลิงก์นี้ใช้ได้เพียงครั้งเดียวเท่านั้น<br>
                • หากมีปัญหา กรุณาติดต่อฝ่ายสนับสนุน
            </div>
        </div>
        
        <div class="footer">
            <p>หากคุณมีปัญหาในการคลิกปุ่ม กรุณาคัดลอกและวางลิงก์ด้านล่างในเบราว์เซอร์:</p>
            <p style="word-break: break-all; color: #059669;">${resetLink}</p>
        </div>
        
        <div class="contact-info">
            <p>© ${new Date().getFullYear()} ระบบจัดการฟาร์ม. สงวนลิขสิทธิ์.</p>
            <p>หากต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุน</p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Generate password reset email plain text version
 */
function generatePasswordResetEmailText(data: PasswordResetEmailData): string {
  const { firstName, phoneNumber, resetLink, expiry } = data

  return `
รีเซ็ตรหัสผ่าน - ระบบจัดการฟาร์ม

สวัสดี${firstName ? ` คุณ${firstName}` : ''}

เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีที่เชื่อมโยงกับเบอร์โทรศัพท์ ${phoneNumber}

หากคุณเป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาคลิกลิงก์ด้านล่างเพื่อสร้างรหัสผ่านใหม่:

${resetLink}

⚠️ ลิงก์นี้จะหมดอายุภายใน ${expiry}

หมายเหตุด้านความปลอดภัย:
• หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้
• อย่าแชร์ลิงก์นี้กับบุคคลอื่น
• ลิงก์นี้ใช้ได้เพียงครั้งเดียวเท่านั้น

© ${new Date().getFullYear()} ระบบจัดการฟาร์ม. สงวนลิขสิทธิ์.
  `.trim()
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userData: {
    firstName?: string
    phoneNumber: string
  },
): Promise<EmailResponse> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }

    // Generate reset link
    const resetLink = `${BASE_URL}/reset-password?token=${resetToken}`

    // Prepare email data
    const emailData: PasswordResetEmailData = {
      firstName: userData.firstName,
      phoneNumber: userData.phoneNumber,
      resetLink,
      expiry: '1 ชั่วโมง',
    }

    // Send email using Resend
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'รีเซ็ตรหัสผ่าน - ระบบจัดการฟาร์ม',
      html: generatePasswordResetEmailHTML(emailData),
      text: generatePasswordResetEmailText(emailData),
    })

    if (response.error) {
      console.error('Resend email error:', response.error)
      return {
        success: false,
        error: response.error.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Send welcome email (optional - for future use)
 */
export async function sendWelcomeEmail(
  to: string,
  userData: {
    firstName?: string
    phoneNumber: string
  },
): Promise<EmailResponse> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required')
    }

    const { firstName, phoneNumber } = userData

    const welcomeHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">ยินดีต้อนรับสู่ระบบจัดการฟาร์ม! 🌾</h1>
        <p>สวัสดี${firstName ? ` คุณ${firstName}` : ''}!</p>
        <p>ขอบคุณที่สมัครสมาชิกกับระบบจัดการฟาร์มของเรา</p>
        <p>เบอร์โทรศัพท์: <strong>${phoneNumber}</strong></p>
        <p>คุณสามารถเข้าสู่ระบบและเริ่มจัดการฟาร์มของคุณได้แล้ว!</p>
        <p style="margin-top: 30px; color: #666;">
          © ${new Date().getFullYear()} ระบบจัดการฟาร์ม
        </p>
      </div>
    `

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'ยินดีต้อนรับสู่ระบบจัดการฟาร์ม! 🌾',
      html: welcomeHTML,
    })

    if (response.error) {
      console.error('Welcome email error:', response.error)
      return {
        success: false,
        error: response.error.message || 'Failed to send welcome email',
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('Welcome email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Validate email configuration
 */
export function validateEmailConfiguration(): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY environment variable is missing')
  }

  if (!process.env.FROM_EMAIL) {
    errors.push('FROM_EMAIL environment variable is missing')
  }

  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    errors.push('NEXT_PUBLIC_BASE_URL environment variable is missing')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Test email connectivity (for development)
 */
export async function testEmailService(): Promise<EmailResponse> {
  try {
    const config = validateEmailConfiguration()

    if (!config.isValid) {
      return {
        success: false,
        error: `Email configuration errors: ${config.errors.join(', ')}`,
      }
    }

    // Send test email to FROM_EMAIL (self-send)
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: [FROM_EMAIL],
      subject: 'Test Email - Farm Management System',
      html: `
        <h1>Email Service Test</h1>
        <p>This is a test email from the Farm Management System.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If you receive this, the email service is working correctly!</p>
      `,
    })

    if (response.error) {
      return {
        success: false,
        error: response.error.message || 'Test email failed',
      }
    }

    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test email failed',
    }
  }
}
