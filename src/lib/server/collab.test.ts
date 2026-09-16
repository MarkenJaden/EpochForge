import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

describe('Yjs CRDT Collaborative Sync Engine', () => {
	it('synchronizes events between two independent Yjs client documents', () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();

		const eventsA = docA.getArray('events');
		const eventsB = docB.getArray('events');

		// Client A adds an event
		const eventMap = new Y.Map();
		eventMap.set('id', 'evt-101');
		eventMap.set('title', 'Quantum Computing Breakthrough');
		eventMap.set('startYear', 2026);
		eventsA.push([eventMap]);

		// Simulate network sync: encode update from A and apply to B
		const updateA = Y.encodeStateAsUpdate(docA);
		Y.applyUpdate(docB, updateA);

		// Assert B received the event
		expect(eventsB.length).toBe(1);
		const received = eventsB.get(0) as Y.Map<any>;
		expect(received.get('title')).toBe('Quantum Computing Breakthrough');

		// Client B updates the title concurrently
		docB.transact(() => {
			received.set('title', 'Quantum Supremacy Confirmed');
		});

		// Sync back to A
		const updateB = Y.encodeStateAsUpdate(docB);
		Y.applyUpdate(docA, updateB);

		const updatedInA = eventsA.get(0) as Y.Map<any>;
		expect(updatedInA.get('title')).toBe('Quantum Supremacy Confirmed');
	});

	it('handles UndoManager actions correctly without data loss', () => {
		const doc = new Y.Doc();
		const events = doc.getArray('events');
		const undoManager = new Y.UndoManager(events);

		const item = new Y.Map();
		item.set('id', 'evt-test');
		item.set('title', 'First Title');
		events.push([item]);

		expect(events.length).toBe(1);
		expect(undoManager.canUndo()).toBe(true);

		undoManager.undo();
		expect(events.length).toBe(0);
		expect(undoManager.canRedo()).toBe(true);

		undoManager.redo();
		expect(events.length).toBe(1);
	});
});
