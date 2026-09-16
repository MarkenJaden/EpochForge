import { describe, it, expect } from 'vitest';
import {
	formatYear,
	calculateTickInterval,
	exportTimelineJson,
	exportTimelineCsv
} from './timeline-time';

describe('Timeline Time Utilities & BCE Support', () => {
	it('correctly formats Common Era (CE) years', () => {
		expect(formatYear(2026)).toBe('2026');
		expect(formatYear(1969)).toBe('1969');
		expect(formatYear(476)).toBe('476');
	});

	it('correctly formats historical Before Common Era (BCE) years', () => {
		expect(formatYear(-500)).toBe('500 BCE');
		expect(formatYear(-3000)).toBe('3000 BCE');
		expect(formatYear(-44)).toBe('44 BCE');
	});

	it('handles astronomical year 0 as 1 BCE', () => {
		expect(formatYear(0)).toBe('1 BCE');
	});

	it('calculates adaptive tick interval based on zoom factor', () => {
		// Low zoom (zoomed out far)
		const zoomedOut = calculateTickInterval(0.01);
		expect(zoomedOut.major).toBe(1000);
		expect(zoomedOut.format).toBe('millennium');

		// Medium zoom (century view)
		const mediumZoom = calculateTickInterval(1);
		expect(mediumZoom.major).toBe(100);
		expect(mediumZoom.format).toBe('century');

		// High zoom (year/month view)
		const highZoom = calculateTickInterval(60);
		expect(highZoom.major).toBe(1);
		expect(highZoom.format).toBe('month');
	});

	it('exports timeline data to valid JSON schema', () => {
		const events = [
			{
				id: 'evt-1',
				title: 'Moon Landing',
				startYear: 1969,
				startDate: '1969-07-20',
				isSpan: false
			}
		];
		const jsonStr = exportTimelineJson(events, 'Space Race');
		const parsed = JSON.parse(jsonStr);

		expect(parsed.title).toBe('Space Race');
		expect(parsed.generator).toBe('EpochForge');
		expect(parsed.events).toHaveLength(1);
		expect(parsed.events[0].title).toBe('Moon Landing');
	});

	it('exports timeline data to CSV with escaped quotes and headers', () => {
		const events = [
			{
				id: 'evt-2',
				title: 'Bronze Age "Early"',
				startYear: -3300,
				startDate: '-3300-01-01',
				endYear: -1200,
				endDate: '-1200-01-01',
				isSpan: true,
				color: '#f59e0b',
				tags: ['Ancient', 'Metallurgy'],
				description: 'Period marked by bronze usage.'
			}
		];
		const csvStr = exportTimelineCsv(events);
		const lines = csvStr.trim().split('\n');

		expect(lines[0]).toBe('id,title,isSpan,startYear,startDate,endYear,endDate,color,tags,description');
		expect(lines[1]).toContain('Bronze Age ""Early""');
		expect(lines[1]).toContain('true');
		expect(lines[1]).toContain('Ancient;Metallurgy');
	});
});
