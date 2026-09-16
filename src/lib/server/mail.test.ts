import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/settings', () => ({
	getSetting: vi.fn().mockImplementation((key: string, defaultValue = '') => {
		if (key === 'smtp_enabled') return Promise.resolve('false');
		if (key === 'smtp_port') return Promise.resolve('587');
		if (key === 'smtp_from') return Promise.resolve('EpochForge <noreply@epochforge.markenjaden.de>');
		return Promise.resolve(defaultValue);
	})
}));

import { getSmtpConfig, sendPasswordResetEmail, sendTestEmail } from './mail';

describe('Mail & SMTP Service', () => {
	it('returns disabled SMTP config by default when unconfigured', async () => {
		const config = await getSmtpConfig();
		expect(config.enabled).toBe(false);
		expect(config.port).toBe(587);
		expect(config.from).toContain('EpochForge');
	});

	it('gracefully reports disabled SMTP when trying to send without setup', async () => {
		const result = await sendTestEmail('test@example.com');
		expect(result.success).toBe(false);
		expect(result.error).toContain('disabled');
	});

	it('gracefully reports disabled SMTP when trying to send password reset', async () => {
		const result = await sendPasswordResetEmail('test@example.com', 'https://example.com/reset-password?token=123');
		expect(result.success).toBe(false);
		expect(result.error).toContain('disabled');
	});
});
