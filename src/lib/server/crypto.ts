import crypto from 'node:crypto';

function getKey(): Buffer {
	const rawKey = process.env.APP_ENCRYPTION_KEY || 'default-secret-epochforge-app-key-32bytes';
	// Derive fixed 32-byte key using SHA-256
	return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts sensitive strings (e.g. OAuth client secrets) using AES-256-GCM.
 */
export function encryptSecret(plainText: string): string {
	if (!plainText) return '';
	const key = getKey();
	const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
	const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

	let encrypted = cipher.update(plainText, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');

	// Format: iv:authTag:encryptedData
	return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted strings.
 */
export function decryptSecret(cipherText: string): string {
	if (!cipherText) return '';
	const parts = cipherText.split(':');
	if (parts.length !== 3) {
		// If not encrypted or invalid format, return as-is
		return cipherText;
	}

	try {
		const [ivHex, authTagHex, encryptedHex] = parts;
		const key = getKey();
		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');

		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(authTag);

		let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	} catch (err) {
		console.error('Failed to decrypt secret:', err);
		return '';
	}
}

/**
 * Computes a SHA-256 hash for API tokens.
 */
export function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}
