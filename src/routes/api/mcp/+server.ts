import { json, error } from '@sveltejs/kit';
import { db, apiTokens, timelines, events, auditLogs, users } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { hashToken } from '$lib/server/crypto';
import type { RequestHandler } from './$types';

interface MCPToolDefinition {
	name: string;
	description: string;
	inputSchema: Record<string, any>;
}

const TOOLS: MCPToolDefinition[] = [
	{
		name: 'list_timelines',
		description: 'Lists all timelines available to the authenticated agent',
		inputSchema: {
			type: 'object',
			properties: {}
		}
	},
	{
		name: 'get_timeline_events',
		description: 'Retrieves all events and epoch spans for a specific timeline',
		inputSchema: {
			type: 'object',
			properties: {
				timeline_id: { type: 'string', description: 'The unique ID of the timeline' }
			},
			required: ['timeline_id']
		}
	},
	{
		name: 'create_event',
		description: 'Creates a new event or epoch span in a timeline with automatic [Agent/MCP] audit logging',
		inputSchema: {
			type: 'object',
			properties: {
				timeline_id: { type: 'string', description: 'The unique ID of the timeline' },
				title: { type: 'string', description: 'Title of the event or epoch' },
				description: { type: 'string', description: 'Detailed description or notes' },
				start_year: { type: 'number', description: 'Start year (use negative for BCE, e.g. -500)' },
				start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format (optional)' },
				end_year: { type: 'number', description: 'End year if this is a span/epoch' },
				end_date: { type: 'string', description: 'End date in YYYY-MM-DD format' },
				is_span: { type: 'boolean', description: 'True if epoch/time-span, false for single event' },
				color: { type: 'string', description: 'Hex color code, e.g. #6366f1' },
				tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag strings' }
			},
			required: ['timeline_id', 'title', 'start_year']
		}
	},
	{
		name: 'update_event',
		description: 'Updates an existing event or epoch span in a timeline with [Agent/MCP] audit logging',
		inputSchema: {
			type: 'object',
			properties: {
				event_id: { type: 'string', description: 'The unique ID of the event to update' },
				title: { type: 'string' },
				description: { type: 'string' },
				start_year: { type: 'number' },
				end_year: { type: 'number' },
				color: { type: 'string' },
				tags: { type: 'array', items: { type: 'string' } }
			},
			required: ['event_id']
		}
	},
	{
		name: 'delete_event',
		description: 'Deletes an event from a timeline with [Agent/MCP] audit logging',
		inputSchema: {
			type: 'object',
			properties: {
				event_id: { type: 'string', description: 'The unique ID of the event to delete' }
			},
			required: ['event_id']
		}
	}
];

async function authenticateToken(authHeader: string | null) {
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}
	const token = authHeader.slice(7).trim();
	const hashed = hashToken(token);

	const [found] = await db
		.select()
		.from(apiTokens)
		.where(eq(apiTokens.tokenHash, hashed))
		.limit(1);

	if (!found) return null;

	// Update last used at
	await db
		.update(apiTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(apiTokens.id, found.id));

	return found;
}

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('Authorization');
	const tokenRecord = await authenticateToken(authHeader);

	if (!tokenRecord) {
		return json(
			{
				jsonrpc: '2.0',
				error: { code: -32001, message: 'Unauthorized: Invalid or missing API token.' },
				id: null
			},
			{ status: 401 }
		);
	}

	const scopes = tokenRecord.scopes || [];
	const body = await request.json();
	const { id, method, params } = body;

	// MCP Protocol handshake
	if (method === 'initialize') {
		return json({
			jsonrpc: '2.0',
			id,
			result: {
				protocolVersion: '2024-11-05',
				capabilities: {
					tools: {}
				},
				serverInfo: {
					name: 'epochforge-mcp-server',
					version: '1.0.0'
				}
			}
		});
	}

	// Tools list
	if (method === 'tools/list') {
		return json({
			jsonrpc: '2.0',
			id,
			result: {
				tools: TOOLS
			}
		});
	}

	// Tools execution
	if (method === 'tools/call') {
		const toolName = params?.name;
		const args = params?.arguments || {};

		try {
			// 1. list_timelines
			if (toolName === 'list_timelines') {
				if (!scopes.includes('timeline:read') && !scopes.includes('*')) {
					return json({
						jsonrpc: '2.0',
						id,
						error: { code: -32003, message: 'Forbidden: Missing timeline:read scope' }
					});
				}

				const result = await db.select().from(timelines).limit(50);
				return json({
					jsonrpc: '2.0',
					id,
					result: {
						content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
					}
				});
			}

			// 2. get_timeline_events
			if (toolName === 'get_timeline_events') {
				if (!scopes.includes('timeline:read') && !scopes.includes('*')) {
					return json({
						jsonrpc: '2.0',
						id,
						error: { code: -32003, message: 'Forbidden: Missing timeline:read scope' }
					});
				}

				const evts = await db
					.select()
					.from(events)
					.where(eq(events.timelineId, args.timeline_id))
					.orderBy(events.startYear);

				return json({
					jsonrpc: '2.0',
					id,
					result: {
						content: [{ type: 'text', text: JSON.stringify(evts, null, 2) }]
					}
				});
			}

			// 3. create_event
			if (toolName === 'create_event') {
				if (!scopes.includes('timeline:write') && !scopes.includes('*')) {
					return json({
						jsonrpc: '2.0',
						id,
						error: { code: -32003, message: 'Forbidden: Missing timeline:write scope' }
					});
				}

				const eventId = crypto.randomUUID();
				const isSpan = Boolean(args.is_span ?? (args.end_year !== undefined));

				await db.insert(events).values({
					id: eventId,
					timelineId: args.timeline_id,
					title: args.title,
					description: args.description || '',
					startYear: Number(args.start_year),
					startDate: args.start_date || `${args.start_year}-01-01`,
					endYear: args.end_year ? Number(args.end_year) : null,
					endDate: args.end_date || null,
					isSpan,
					color: args.color || '#6366f1',
					tags: args.tags || [],
					createdAt: new Date(),
					updatedAt: new Date()
				});

				// Document cleanly with [Agent/MCP] tag in audit log
				await db.insert(auditLogs).values({
					id: crypto.randomUUID(),
					timelineId: args.timeline_id,
					userId: tokenRecord.userId,
					action: 'create',
					entityType: 'event',
					entityId: eventId,
					diff: { title: args.title, startYear: args.start_year, isSpan },
					source: 'agent_mcp',
					createdAt: new Date()
				});

				return json({
					jsonrpc: '2.0',
					id,
					result: {
						content: [
							{
								type: 'text',
								text: `Event '${args.title}' created successfully with ID ${eventId} [Agent/MCP]`
							}
						]
					}
				});
			}

			// 4. update_event
			if (toolName === 'update_event') {
				if (!scopes.includes('timeline:write') && !scopes.includes('*')) {
					return json({
						jsonrpc: '2.0',
						id,
						error: { code: -32003, message: 'Forbidden: Missing timeline:write scope' }
					});
				}

				const [existing] = await db
					.select()
					.from(events)
					.where(eq(events.id, args.event_id))
					.limit(1);

				if (!existing) {
					return json({
						jsonrpc: '2.0',
						id,
						error: { code: -32004, message: 'Event not found' }
					});
				}

				const updates: any = { updatedAt: new Date() };
				if (args.title !== undefined) updates.title = args.title;
				if (args.description !== undefined) updates.description = args.description;
				if (args.start_year !== undefined) updates.startYear = Number(args.start_year);
				if (args.end_year !== undefined) updates.endYear = Number(args.end_year);
				if (args.color !== undefined) updates.color = args.color;
				if (args.tags !== undefined) updates.tags = args.tags;

				await db.update(events).set(updates).where(eq(events.id, args.event_id));

				// Audit log with [Agent/MCP]
				await db.insert(auditLogs).values({
					id: crypto.randomUUID(),
					timelineId: existing.timelineId,
					userId: tokenRecord.userId,
					action: 'update',
					entityType: 'event',
					entityId: args.event_id,
					diff: updates,
					source: 'agent_mcp',
					createdAt: new Date()
				});

				return json({
					jsonrpc: '2.0',
					id,
					result: {
						content: [
							{
								type: 'text',
								text: `Event ${args.event_id} updated successfully [Agent/MCP]`
							}
						]
					}
				});
			}

			// 5. delete_event
			if (toolName === 'delete_event') {
				if (!scopes.includes('timeline:write') && !scopes.includes('*')) {
					return json({
						jsonrpc: '2.0',
						id,
						error: { code: -32003, message: 'Forbidden: Missing timeline:write scope' }
					});
				}

				const [existing] = await db
					.select()
					.from(events)
					.where(eq(events.id, args.event_id))
					.limit(1);

				if (existing) {
					await db.delete(events).where(eq(events.id, args.event_id));

					// Audit log with [Agent/MCP]
					await db.insert(auditLogs).values({
						id: crypto.randomUUID(),
						timelineId: existing.timelineId,
						userId: tokenRecord.userId,
						action: 'delete',
						entityType: 'event',
						entityId: args.event_id,
						diff: { title: existing.title },
						source: 'agent_mcp',
						createdAt: new Date()
					});
				}

				return json({
					jsonrpc: '2.0',
					id,
					result: {
						content: [
							{
								type: 'text',
								text: `Event ${args.event_id} deleted successfully [Agent/MCP]`
							}
						]
					}
				});
			}

			return json({
				jsonrpc: '2.0',
				id,
				error: { code: -32601, message: `Tool '${toolName}' not found` }
			});
		} catch (err: any) {
			return json({
				jsonrpc: '2.0',
				id,
				error: { code: -32000, message: err?.message || 'Execution error' }
			});
		}
	}

	return json({
		jsonrpc: '2.0',
		id: id || null,
		error: { code: -32601, message: `Method '${method}' not supported` }
	});
};
