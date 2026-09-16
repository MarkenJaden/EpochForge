/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				forge: {
					50: '#f4f6fb',
					100: '#e8edf6',
					200: '#cbd7ec',
					300: '#9fb6dc',
					400: '#6c8ec8',
					500: '#486eb4',
					600: '#355598',
					700: '#2c447c',
					800: '#273a66',
					900: '#243254',
					950: '#151d33',
				}
			}
		}
	},
	plugins: []
};
