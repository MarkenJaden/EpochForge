import { pgTable, text, timestamp, boolean, integer, json, primaryKey } from 'drizzle-orm/pg-core';

// --- Better-Auth Tables ---

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false).notNull(),
	image: text('image'),
	role: text('role').default('user').notNull(), // 'superadmin' | 'user'
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
});

export const accounts = pgTable('accounts', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const verifications = pgTable('verifications', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// --- System Settings (Encrypted DB Secrets & Config) ---

export const systemSettings = pgTable('system_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	encrypted: boolean('encrypted').default(false).notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// --- Timelines & ACL ---

export const timelines = pgTable('timelines', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').default(''),
	isPublic: boolean('is_public').default(false).notNull(),
	defaultView: text('default_view').default('horizontal').notNull(), // 'horizontal' | 'vertical' | 'gantt'
	ownerId: text('owner_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const timelineCollaborators = pgTable('timeline_collaborators', {
	id: text('id').primaryKey(),
	timelineId: text('timeline_id')
		.notNull()
		.references(() => timelines.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	role: text('role').default('editor').notNull(), // 'owner' | 'editor' | 'viewer'
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// --- Events & Epoch Spans ---

export const events = pgTable('events', {
	id: text('id').primaryKey(),
	timelineId: text('timeline_id')
		.notNull()
		.references(() => timelines.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description').default(''),
	startYear: integer('start_year').notNull(), // Supports negative years for BCE, e.g. -500
	startDate: text('start_date').notNull(), // ISO-like or YYYY-MM-DD
	endYear: integer('end_year'), // Null for single point-in-time events
	endDate: text('end_date'),
	isSpan: boolean('is_span').default(false).notNull(), // true for epochs/spans
	color: text('color').default('#6366f1'),
	bgImageUrl: text('bg_image_url'),
	bgPattern: text('bg_pattern'), // 'dots' | 'stripes' | 'grid' | 'waves'
	badgeIcon: text('badge_icon'),
	tags: json('tags').$type<string[]>().default([]),
	metadata: json('metadata').$type<Record<string, any>>().default({}),
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// --- Yjs Binary CRDT Persistence ---

export const timelineYjsDocs = pgTable('timeline_yjs_docs', {
	timelineId: text('timeline_id').primaryKey(),
	docState: text('doc_state').notNull(), // Base64 encoded binary Yjs update
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// --- Immutable Audit Logs ---

export const auditLogs = pgTable('audit_logs', {
	id: text('id').primaryKey(),
	timelineId: text('timeline_id').references(() => timelines.id, { onDelete: 'cascade' }),
	userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
	action: text('action').notNull(), // 'create' | 'update' | 'delete' | 'permission_change' | 'import'
	entityType: text('entity_type').notNull(), // 'timeline' | 'event' | 'setting' | 'collaborator'
	entityId: text('entity_id'),
	diff: json('diff').$type<Record<string, any>>().default({}),
	source: text('source').default('web').notNull(), // 'web' | 'agent_mcp'
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// --- API Tokens for MCP & External Agents ---

export const apiTokens = pgTable('api_tokens', {
	id: text('id').primaryKey(),
	tokenHash: text('token_hash').notNull().unique(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	scopes: json('scopes').$type<string[]>().notNull(), // ['timeline:read', 'timeline:write', 'timeline:audit']
	lastUsedAt: timestamp('last_used_at'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});
