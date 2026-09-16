import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getSetting } from '$lib/server/settings';

export interface SmtpConfig {
	enabled: boolean;
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	from: string;
}

/**
 * Retrieves the current SMTP configuration from the system settings table.
 */
export async function getSmtpConfig(): Promise<SmtpConfig> {
	const [enabled, host, portStr, secureStr, user, pass, from] = await Promise.all([
		getSetting('smtp_enabled', 'false'),
		getSetting('smtp_host', ''),
		getSetting('smtp_port', '587'),
		getSetting('smtp_secure', 'false'),
		getSetting('smtp_user', ''),
		getSetting('smtp_password', ''), // Decrypted automatically by getSetting
		getSetting('smtp_from', 'EpochForge <noreply@epochforge.markenjaden.de>')
	]);

	const port = parseInt(portStr, 10) || 587;
	const secure = secureStr === 'true' || port === 465;

	return {
		enabled: enabled === 'true',
		host: host.trim(),
		port,
		secure,
		user: user.trim(),
		pass: pass.trim(),
		from: from.trim() || 'EpochForge <noreply@epochforge.markenjaden.de>'
	};
}

/**
 * Creates a Nodemailer transporter based on current DB settings.
 */
export async function createMailTransporter(): Promise<Transporter | null> {
	const config = await getSmtpConfig();
	if (!config.enabled || !config.host) {
		return null;
	}

	const auth =
		config.user && config.pass
			? {
					user: config.user,
					pass: config.pass
				}
			: undefined;

	return nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth,
		tls: {
			rejectUnauthorized: process.env.NODE_ENV === 'production'
		}
	});
}

export interface SendMailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Sends an email using the configured SMTP server.
 */
export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const config = await getSmtpConfig();
	if (!config.enabled) {
		console.warn('SMTP is disabled. Email skipped:', options.subject, 'to:', options.to);
		return { success: false, error: 'SMTP is disabled in system settings.' };
	}

	const transporter = await createMailTransporter();
	if (!transporter) {
		return { success: false, error: 'SMTP is not properly configured (host missing).' };
	}

	try {
		const info = await transporter.sendMail({
			from: config.from,
			to: options.to,
			subject: options.subject,
			text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
			html: options.html
		});
		return { success: true, messageId: info.messageId };
	} catch (err: any) {
		console.error('Failed to send email:', err);
		return { success: false, error: err.message || 'Unknown SMTP error' };
	}
}

/**
 * Sends a test email to verify SMTP connection.
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; error?: string }> {
	const config = await getSmtpConfig();
	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 540px; margin: 0 auto; padding: 32px; }
    .badge { display: inline-block; background-color: #059669; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 12px 0; color: #ffffff; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
    .details { background-color: #0f172a; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #cbd5e1; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">SMTP Connectivity Verified</span>
    <h1>EpochForge Test Email</h1>
    <p>This is a confirmation test email from your EpochForge instance. Your SMTP email delivery settings are configured properly!</p>
    <div class="details">
      <div><strong>Host:</strong> ${config.host}:${config.port}</div>
      <div><strong>Encryption:</strong> ${config.secure ? 'SSL/TLS' : 'STARTTLS'}</div>
      <div><strong>Sender:</strong> ${config.from}</div>
      <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
    </div>
    <p>You can now send invitation emails, password reset links, and system notifications reliably.</p>
    <div class="footer">EpochForge &bull; Open-Source Collaborative Timeline Platform</div>
  </div>
</body>
</html>`;

	return sendMail({
		to: toEmail,
		subject: 'EpochForge SMTP Test — Success',
		html,
		text: `EpochForge SMTP Test: Your SMTP settings are working properly. Host: ${config.host}:${config.port}`
	});
}

/**
 * Sends a password reset email with the reset link.
 */
export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 540px; margin: 0 auto; padding: 32px; }
    h1 { font-size: 22px; margin: 0 0 12px 0; color: #ffffff; }
    p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin: 12px 0 24px 0; }
    .link-fallback { word-break: break-all; font-size: 12px; color: #64748b; background-color: #0f172a; padding: 12px; border-radius: 6px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Reset Your EpochForge Password</h1>
    <p>We received a request to reset the password for your EpochForge account associated with <strong>${toEmail}</strong>.</p>
    <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
    <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
    <p style="margin-top: 16px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <div class="link-fallback">${resetUrl}</div>
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
    <div class="footer">EpochForge &bull; Open-Source Collaborative Timeline Platform</div>
  </div>
</body>
</html>`;

	return sendMail({
		to: toEmail,
		subject: 'Reset your EpochForge password',
		html,
		text: `Reset your EpochForge password by visiting this link: ${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email.`
	});
}
