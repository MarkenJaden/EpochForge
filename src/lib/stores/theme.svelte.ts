import { browser } from '$app/environment';

class ThemeManager {
	current = $state<'dark' | 'light'>('dark');

	constructor() {
		if (browser) {
			const saved = localStorage.getItem('epochforge-theme') as 'dark' | 'light' | null;
			if (saved === 'light' || saved === 'dark') {
				this.setTheme(saved);
			} else {
				// Default to dark or follow system preference
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				this.setTheme(prefersDark ? 'dark' : 'light');
			}
		}
	}

	setTheme(theme: 'dark' | 'light') {
		this.current = theme;
		if (browser) {
			localStorage.setItem('epochforge-theme', theme);
			if (theme === 'dark') {
				document.documentElement.classList.add('dark');
				document.documentElement.classList.remove('light');
			} else {
				document.documentElement.classList.remove('dark');
				document.documentElement.classList.add('light');
			}
		}
	}

	toggle() {
		this.setTheme(this.current === 'dark' ? 'light' : 'dark');
	}
}

export const theme = new ThemeManager();
