import { describe, it, expect } from 'vitest';
import {
	formatYear,
	dateToFractionalYear,
	formatEventDisplayDate,
	calculateTickInterval,
	generateAdaptiveRulerTicks,
	exportTimelineJson,
	exportTimelineCsv
} from './timeline-time';

describe('Timeline Time Utilities & Adaptive Multi-Scale Engine', () => {
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

	it('calculates fractional years from optional date strings', () => {
		// Null or empty date retains integer year
		expect(dateToFractionalYear(1492, null)).toBe(1492);
		expect(dateToFractionalYear(1492, '')).toBe(1492);

		// Jan 1st is 0.0 fraction
		expect(dateToFractionalYear(2024, '2024-01-01')).toBe(2024);

		// Mid-year is approximately 0.5
		const midYear = dateToFractionalYear(2024, '2024-07-02');
		expect(midYear).toBeGreaterThan(2024.49);
		expect(midYear).toBeLessThan(2024.52);

		// Dec 31st is close to next year
		const endYear = dateToFractionalYear(2023, '2023-12-31');
		expect(endYear).toBeGreaterThan(2023.99);
	});

	it('formats event display date adaptively based on whether specific date was provided', () => {
		// Year only (no date)
		expect(formatEventDisplayDate(1492, null)).toBe('1492');
		expect(formatEventDisplayDate(-500, undefined)).toBe('500 BCE');

		// Full date
		expect(formatEventDisplayDate(1969, '1969-07-20')).toBe('Jul 20, 1969');
		expect(formatEventDisplayDate(1989, '1989-11-09')).toBe('Nov 9, 1989');

		// Month and year only
		expect(formatEventDisplayDate(1945, '1945-05')).toBe('May 1945');
	});

	it('calculates adaptive tick interval across multiple scales from millennia to days', () => {
		// Millennium scale
		const millenniumZoom = calculateTickInterval(0.01);
		expect(millenniumZoom.format).toBe('millennium');
		expect(millenniumZoom.major).toBe(1000);

		// Century scale
		const centuryZoom = calculateTickInterval(1);
		expect(centuryZoom.format).toBe('century');
		expect(centuryZoom.major).toBe(100);

		// Decade scale
		const decadeZoom = calculateTickInterval(8);
		expect(decadeZoom.format).toBe('decade');
		expect(decadeZoom.major).toBe(10);

		// Year scale
		const yearZoom = calculateTickInterval(30);
		expect(yearZoom.format).toBe('year');
		expect(yearZoom.major).toBe(5);

		// Month scale
		const monthZoom = calculateTickInterval(100);
		expect(monthZoom.format).toBe('month');

		// Day scale
		const dayZoom = calculateTickInterval(500);
		expect(dayZoom.format).toBe('day');
	});

	it('generates adaptive ruler ticks with month subdivisions when zoomed in', () => {
		const ticks = generateAdaptiveRulerTicks(2024.0, 2024.5, 120);
		expect(ticks.length).toBeGreaterThan(0);
		expect(ticks.some((t) => t.label === '2024')).toBe(true);
		expect(ticks.some((t) => t.label === 'Feb')).toBe(true);
		expect(ticks.some((t) => t.label === 'Mar')).toBe(true);
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
				startDate: null,
				endYear: -1200,
				endDate: null,
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
