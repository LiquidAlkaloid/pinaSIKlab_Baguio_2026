<script lang="ts">
	import { page } from '$app/state';
	import Logo from '#lib/components/Logo.svelte';
	import { teacher } from '#lib/data.ts';

	let { children } = $props();
</script>

<div class="desk">
	<header class="top">
		<a href="/teacher" class="brand" aria-label="Teacher home"><Logo size={28} /></a>
		<nav>
			<a href="/teacher" aria-current={page.url.pathname === '/teacher' ? 'page' : undefined}>Teacher home</a>
			<a href="/teacher/new" aria-current={page.url.pathname === '/teacher/new' ? 'page' : undefined}>New assignment</a>
		</nav>
		<div class="who">
			<span class="small muted">{teacher.full_name}</span>
			<a class="btn btn-ghost btn-small" href="/student">Student view</a>
		</div>
	</header>
	<main>
		{@render children()}
	</main>
</div>

<style>
	.desk {
		min-height: 100dvh;
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding: 0.75rem clamp(1rem, 3vw, 2rem);
		background: var(--surface);
		border-bottom: 1px solid var(--line);
	}
	.brand {
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: 0.25rem;
		flex: 1;
	}
	nav a {
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		text-decoration: none;
		color: var(--ink-2);
		font-weight: 700;
	}
	nav a[aria-current='page'] {
		background: var(--brand-soft);
		color: var(--brand);
	}
	.who {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	main {
		max-width: 76rem;
		margin: 0 auto;
		padding: 1.5rem clamp(1rem, 3vw, 2rem) 3rem;
	}
</style>
