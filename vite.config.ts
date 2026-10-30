import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			// Static files only: works on Cloudflare Pages and needs no server.
			adapter: adapter()
		})
	]
});
