/**
 * Formats a year, correctly distinguishing CE and BCE (negative years).
 * Example: -500 -> "500 BCE", 1789 -> "1789 CE" or "1789"
 */
export function formatYear(year: number): string {
	if (year < 0) {
		return `${Math.abs(year)} BCE`;
	}
	if (year === 0) {
		return '1 BCE'; // Astronomical 0 is usually 1 BCE
	}
	return `${year}`;
}

/**
 * Calculates adaptive tick interval in years based on zoom level (pixels per year).
 */
export function calculateTickInterval(pixelsPerYear: number): {
	major: number;
	minor: number;
	format: 'millennium' | 'century' | 'decade' | 'year' | 'month';
} {
	if (pixelsPerYear < 0.05) {
		return { major: 1000, minor: 500, format: 'millennium' };
	} else if (pixelsPerYear < 0.5) {
		return { major: 500, minor: 100, format: 'century' };
	} else if (pixelsPerYear < 2) {
		return { major: 100, minor: 20, format: 'century' };
	} else if (pixelsPerYear < 10) {
		return { major: 10, minor: 5, format: 'decade' };
	} else if (pixelsPerYear < 50) {
		return { major: 5, minor: 1, format: 'year' };
	} else {
		return { major: 1, minor: 0.25, format: 'month' };
	}
}

/**
 * Exports timeline events to a clean JSON string.
 */
export function exportTimelineJson(events: any[], title: string): string {
	const payload = {
		title,
		exportedAt: new Date().toISOString(),
		generator: 'EpochForge',
		events
	};
	return JSON.stringify(payload, null, 2);
}

/**
 * Exports timeline events to CSV format.
 */
export function exportTimelineCsv(events: any[]): string {
	const headers = ['id', 'title', 'isSpan', 'startYear', 'startDate', 'endYear', 'endDate', 'color', 'tags', 'description'];
	const rows = events.map((e) => {
		const esc = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
		return [
			esc(e.id),
			esc(e.title),
			e.isSpan ? 'true' : 'false',
			e.startYear,
			esc(e.startDate),
			e.endYear ?? '',
			esc(e.endDate ?? ''),
			esc(e.color),
			esc(Array.isArray(e.tags) ? e.tags.join(';') : ''),
			esc(e.description)
		].join(',');
	});

	return [headers.join(','), ...rows].join('\n');
}
