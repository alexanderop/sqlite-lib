// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid(),
		starlight({
			title: 'SQLite Web',
			description: 'Type-safe browser SQLite with WASM, OPFS, and reactive Vue integration',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/yourusername/sqlite-web' }
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'index' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Core Package',
					items: [
						{ label: 'Overview', slug: 'core/overview' },
						{ label: 'Schema Definition', slug: 'core/schema' },
						{ label: 'Query Builder', slug: 'core/query-builder' },
						{ label: 'Mutations', slug: 'core/mutations' },
						{ label: 'Migrations', slug: 'core/migrations' },
					],
				},
				{
					label: 'Vue Integration',
					items: [
						{ label: 'Overview', slug: 'vue/overview' },
						{ label: 'Plugin Setup', slug: 'vue/plugin' },
						{ label: 'Composables', slug: 'vue/composables' },
						{ label: 'Reactive Queries', slug: 'vue/reactive-queries' },
					],
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'api' },
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Type Safety', slug: 'guides/type-safety' },
						{ label: 'Browser Setup', slug: 'guides/browser-setup' },
						{ label: 'Publishing', slug: 'guides/publishing' },
					],
				},
			],
		}),
	],
});
