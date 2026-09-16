import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'hocuspocus-dev-server',
			configureServer(server) {
				server.httpServer?.on('upgrade', async (req, socket, head) => {
					if (req.url?.startsWith('/ws')) {
						try {
							const { hocuspocusServer } = await server.ssrLoadModule('/src/lib/server/collab.ts');
							hocuspocusServer.handleConnection(socket, req, head);
						} catch (err) {
							console.error('WebSocket upgrade error:', err);
							socket.destroy();
						}
					}
				});
			}
		}
	],
	server: {
		port: 3000,
		host: '0.0.0.0'
	}
});
