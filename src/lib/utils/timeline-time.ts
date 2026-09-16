/**
 * Formats a year, correctly distinguishing CE and BCE (negative years).
 * Example: -500 -> "500 BCE", 1789 -> "1789", 0 -> "1 BCE"
 */
export function formatYear(year: number): string {
	if (year < 0) {
		return `${Math.abs(year)} BCE`;
	}
	if (year === 0) {
		return '1 BCE'; // Astronomical 0 is typically 1 BCE
	}
	return `${year}`;
}

const MONTH_NAMES_SHORT = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isLeapYear(year: number): boolean {
	const absYear = Math.abs(year);
	return (absYear % 4 === 0 && absYear % 100 !== 0) || absYear % 400 === 0;
}

/**
 * Converts a calendar year and optional ISO/YYYY-MM-DD date string
 * into a continuous fractional year coordinate on the timeline.
 * Example:
 *  - (2024, "2024-01-01") -> 2024.0
 *  - (2024, "2024-07-02") -> ~2024.5
 *  - (1492, null) -> 1492.0
 */
export function dateToFractionalYear(year: number, dateStr?: string | null): number {
	if (!dateStr || typeof dateStr !== 'string') {
		return year;
	}

	const trimmed = dateStr.trim();
	// Match optional leading minus, year, month, day
	const match = trimmed.match(/^(-?\d+)-(\d{2})(?:-(\d{2}))?/);
	if (!match) {
		return year;
	}

	const month = Math.max(1, Math.min(12, parseInt(match[2], 10)));
	const day = match[3] ? Math.max(1, Math.min(31, parseInt(match[3], 10))) : 1;

	const daysInFeb = isLeapYear(year) ? 29 : 28;
	const daysInMonths = [...MONTH_DAYS];
	daysInMonths[1] = daysInFeb;
	const totalDays = isLeapYear(year) ? 366 : 365;

	let dayOfYear = day - 1;
	for (let m = 0; m < month - 1; m++) {
		dayOfYear += daysInMonths[m];
	}

	const fraction = Math.max(0, Math.min(0.9999, dayOfYear / totalDays));
	return year + fraction;
}

/**
 * Formats an event date nicely for UI cards and badges.
 * If a specific date is given (e.g. 1969-07-20), displays "Jul 20, 1969".
 * If only a year is available (or BCE), displays e.g. "1492" or "500 BCE".
 */
export function formatEventDisplayDate(year: number, dateStr?: string | null): string {
	if (!dateStr || typeof dateStr !== 'string') {
		return formatYear(year);
	}

	const trimmed = dateStr.trim();
	const match = trimmed.match(/^(-?\d+)-(\d{2})(?:-(\d{2}))?/);
	if (!match) {
		return formatYear(year);
	}

	const parsedYear = parseInt(match[1], 10);
	const monthIdx = Math.max(0, Math.min(11, parseInt(match[2], 10) - 1));
	const monthName = MONTH_NAMES_SHORT[monthIdx];
	const formattedYear = formatYear(parsedYear || year);

	if (match[3]) {
		const day = parseInt(match[3], 10);
		return `${monthName} ${day}, ${formattedYear}`;
	}

	return `${monthName} ${formattedYear}`;
}

export type TickScale = 'millennium' | 'century' | 'decade' | 'year' | 'month' | 'day';

/**
 * Calculates adaptive tick interval in years based on zoom level (pixels per year).
 */
export function calculateTickInterval(pixelsPerYear: number): {
	major: number;
	minor: number;
	format: TickScale;
} {
	if (pixelsPerYear < 0.005) {
		return { major: 10000, minor: 5000, format: 'millennium' };
	} else if (pixelsPerYear < 0.05) {
		return { major: 1000, minor: 500, format: 'millennium' };
	} else if (pixelsPerYear < 0.5) {
		return { major: 500, minor: 100, format: 'century' };
	} else if (pixelsPerYear < 2) {
		return { major: 100, minor: 20, format: 'century' };
	} else if (pixelsPerYear < 10) {
		return { major: 10, minor: 5, format: 'decade' };
	} else if (pixelsPerYear < 50) {
		return { major: 5, minor: 1, format: 'year' };
	} else if (pixelsPerYear < 300) {
		return { major: 1, minor: 1 / 12, format: 'month' };
	} else {
		return { major: 1 / 12, minor: 1 / 365, format: 'day' };
	}
}

export interface TimelineRulerTick {
	fractionalYear: number;
	label: string;
	subLabel?: string;
	isMajor: boolean;
	scale: TickScale;
}

/**
 * Generates an array of ruler ticks dynamically adapted to visible range and zoom scale.
 */
export function generateAdaptiveRulerTicks(
	startFractionalYear: number,
	endFractionalYear: number,
	pixelsPerYear: number
): TimelineRulerTick[] {
	const tickConfig = calculateTickInterval(pixelsPerYear);
	const ticks: TimelineRulerTick[] = [];

	if (tickConfig.format === 'month') {
		// Zoomed in enough to show months within years
		const startYear = Math.floor(startFractionalYear);
		const endYear = Math.ceil(endFractionalYear);

		for (let y = startYear; y <= endYear; y++) {
			for (let m = 0; m < 12; m++) {
				const frac = y + m / 12;
				if (frac >= startFractionalYear - 0.2 && frac <= endFractionalYear + 0.2) {
					const isJan = m === 0;
					ticks.push({
						fractionalYear: frac,
						label: isJan ? formatYear(y) : MONTH_NAMES_SHORT[m],
						subLabel: isJan ? undefined : formatYear(y),
						isMajor: isJan,
						scale: 'month'
					});
				}
			}
		}
	} else if (tickConfig.format === 'day') {
		// Extremely zoomed in: show months as major, day intervals
		const startYear = Math.floor(startFractionalYear);
		const endYear = Math.ceil(endFractionalYear);

		for (let y = startYear; y <= endYear; y++) {
			for (let m = 0; m < 12; m++) {
				const monthFrac = y + m / 12;
				if (monthFrac >= startFractionalYear - 0.1 && monthFrac <= endFractionalYear + 0.1) {
					ticks.push({
						fractionalYear: monthFrac,
						label: `${MONTH_NAMES_SHORT[m]} ${formatYear(y)}`,
						isMajor: true,
						scale: 'day'
					});
				}
			}
		}
	} else {
		// Years, Decades, Centuries, Millennia
		const major = tickConfig.major;
		const firstTick = Math.floor(startFractionalYear / major) * major;
		const lastTick = Math.ceil(endFractionalYear / major) * major;

		for (let y = firstTick; y <= lastTick; y += major) {
			ticks.push({
				fractionalYear: y,
				label: formatYear(y),
				isMajor: true,
				scale: tickConfig.format
			});
		}
	}

	return ticks;
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
			esc(e.startDate ?? ''),
			e.endYear ?? '',
			esc(e.endDate ?? ''),
			esc(e.color),
			esc(Array.isArray(e.tags) ? e.tags.join(';') : ''),
			esc(e.description)
		].join(',');
	});

	return [headers.join(','), ...rows].join('\n');
}
