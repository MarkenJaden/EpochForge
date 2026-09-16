import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

export interface TimelineEventData {
	id: string;
	title: string;
	description: string;
	startYear: number;
	startDate: string;
	endYear?: number | null;
	endDate?: string | null;
	isSpan: boolean;
	color?: string;
	bgImageUrl?: string;
	bgPattern?: string;
	badgeIcon?: string;
	tags?: string[];
	metadata?: Record<string, any>;
}

export interface CollabUser {
	clientId: number;
	name: string;
	color: string;
	cursor?: { x: number; y: number } | null;
	activeEventId?: string | null;
}

const USER_COLORS = [
	'#ef4444',
	'#f97316',
	'#eab308',
	'#22c55e',
	'#06b6d4',
	'#3b82f6',
	'#8b5cf6',
	'#ec4899'
];

export class TimelineCollabClient {
	ydoc: Y.Doc;
	provider: HocuspocusProvider | null = null;
	yEvents: Y.Array<Y.Map<any>>;
	undoManager: Y.UndoManager;

	events = $state<TimelineEventData[]>([]);
	connectedUsers = $state<CollabUser[]>([]);
	status = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	canUndo = $state(false);
	canRedo = $state(false);

	private userColor: string;
	private userName: string;

	constructor(timelineId: string, currentUser?: { id: string; name: string }) {
		this.ydoc = new Y.Doc();
		this.yEvents = this.ydoc.getArray('events');
		this.undoManager = new Y.UndoManager(this.yEvents);

		this.userName = currentUser?.name || 'Anonymous ' + Math.floor(Math.random() * 1000);
		this.userColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

		// Determine WS endpoint
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws`;

		this.provider = new HocuspocusProvider({
			url: wsUrl,
			name: timelineId,
			document: this.ydoc,
			onStatus: ({ status }) => {
				this.status = status as any;
			}
		});

		// Awareness
		const awareness = this.provider.awareness;
		if (awareness) {
			awareness.setLocalStateField('user', {
				name: this.userName,
				color: this.userColor
			});

			awareness.on('change', () => {
				const states = awareness.getStates();
				const usersList: CollabUser[] = [];
				states.forEach((state: any, clientId: number) => {
					if (clientId !== awareness.clientID && state.user) {
						usersList.push({
							clientId,
							name: state.user.name,
							color: state.user.color,
							cursor: state.cursor,
							activeEventId: state.activeEventId
						});
					}
				});
				this.connectedUsers = usersList;
			});
		}

		// Y.Array event observer
		this.syncEventsFromYDoc();
		this.yEvents.observeDeep(() => {
			this.syncEventsFromYDoc();
			this.canUndo = this.undoManager.canUndo();
			this.canRedo = this.undoManager.canRedo();
		});

		this.undoManager.on('stack-item-added', () => {
			this.canUndo = this.undoManager.canUndo();
			this.canRedo = this.undoManager.canRedo();
		});

		this.undoManager.on('stack-item-popped', () => {
			this.canUndo = this.undoManager.canUndo();
			this.canRedo = this.undoManager.canRedo();
		});
	}

	private syncEventsFromYDoc() {
		const raw = this.yEvents.toArray();
		const list: TimelineEventData[] = [];
		for (const item of raw) {
			if (item instanceof Y.Map) {
				list.push({
					id: item.get('id') || crypto.randomUUID(),
					title: item.get('title') || 'Untitled Event',
					description: item.get('description') || '',
					startYear: item.get('startYear') ?? 2026,
					startDate: item.get('startDate') || '2026-01-01',
					endYear: item.get('endYear') ?? null,
					endDate: item.get('endDate') ?? null,
					isSpan: Boolean(item.get('isSpan')),
					color: item.get('color') || '#6366f1',
					bgImageUrl: item.get('bgImageUrl') || '',
					bgPattern: item.get('bgPattern') || '',
					badgeIcon: item.get('badgeIcon') || '',
					tags: item.get('tags') || [],
					metadata: item.get('metadata') || {}
				});
			}
		}
		this.events = list;
	}

	setCursor(x: number, y: number) {
		this.provider?.awareness?.setLocalStateField('cursor', { x, y });
	}

	setActiveEvent(eventId: string | null) {
		this.provider?.awareness?.setLocalStateField('activeEventId', eventId);
	}

	addEvent(event: TimelineEventData) {
		const map = new Y.Map();
		map.set('id', event.id);
		map.set('title', event.title);
		map.set('description', event.description);
		map.set('startYear', event.startYear);
		map.set('startDate', event.startDate);
		map.set('endYear', event.endYear ?? null);
		map.set('endDate', event.endDate ?? null);
		map.set('isSpan', event.isSpan);
		map.set('color', event.color || '#6366f1');
		map.set('bgImageUrl', event.bgImageUrl || '');
		map.set('bgPattern', event.bgPattern || '');
		map.set('tags', event.tags || []);
		map.set('metadata', event.metadata || {});

		this.ydoc.transact(() => {
			this.yEvents.push([map]);
		});
	}

	updateEvent(id: string, updates: Partial<TimelineEventData>) {
		this.ydoc.transact(() => {
			for (let i = 0; i < this.yEvents.length; i++) {
				const item = this.yEvents.get(i);
				if (item instanceof Y.Map && item.get('id') === id) {
					for (const [key, value] of Object.entries(updates)) {
						item.set(key, value);
					}
					break;
				}
			}
		});
	}

	deleteEvent(id: string) {
		this.ydoc.transact(() => {
			for (let i = 0; i < this.yEvents.length; i++) {
				const item = this.yEvents.get(i);
				if (item instanceof Y.Map && item.get('id') === id) {
					this.yEvents.delete(i, 1);
					break;
				}
			}
		});
	}

	undo() {
		if (this.undoManager.canUndo()) {
			this.undoManager.undo();
		}
	}

	redo() {
		if (this.undoManager.canRedo()) {
			this.undoManager.redo();
		}
	}

	destroy() {
		this.provider?.destroy();
		this.ydoc.destroy();
	}
}
