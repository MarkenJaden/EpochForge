import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret, hashToken } from './crypto';

describe('Crypto & Secrets Security', () => {
	it('should encrypt and decrypt strings using AES-256-GCM correctly', () => {
		const secret = 'super-confidential-oauth-client-secret-12345';
		const encrypted = encryptSecret(secret);

		expect(encrypted).not.toBe(secret);
		expect(encrypted).toContain(':');

		const decrypted = decryptSecret(encrypted);
		expect(decrypted).toBe(secret);
	});

	it('should return empty string when encrypting empty inputs', () => {
		expect(encryptSecret('')).toBe('');
		expect(decryptSecret('')).toBe('');
	});

	it('should handle tampered ciphertext gracefully without throwing uncaught errors', () => {
		const secret = 'another-secret';
		const encrypted = encryptSecret(secret);
		const parts = encrypted.split(':');
		// Tamper with payload
		const tampered = `${parts[0]}:${parts[1]}:badhexpayload`;

		const result = decryptSecret(tampered);
		expect(result).toBe('');
	});

	it('should generate deterministic SHA-256 hash for API tokens', () => {
		const token = 'epoch_live_token_abc123';
		const hash1 = hashToken(token);
		const hash2 = hashToken(token);

		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(64); // 256 bits in hex
	});
});
