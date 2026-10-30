<script lang="ts">
	import Logo from '#lib/components/Logo.svelte';
	import { student } from '#lib/data.ts';

	let { children } = $props();
</script>

<div class="phone">
	<header class="top">
		<a href="/student" aria-label="Student home"><Logo size={26} /></a>
		<a class="avatar" href="/" title="Switch user">{student.initials}</a>
	</header>
	<main class="stack">
		{@render children()}
	</main>
</div>

<style>
	.phone {
		max-width: 30rem;
		margin: 0 auto;
		min-height: 100dvh;
		padding: 0 1rem 3rem;
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 5;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: blur(8px);
	}
	.top a {
		text-decoration: none;
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--brand-soft);
		color: var(--brand);
		font-weight: 700;
		font-size: 0.85rem;
	}
	main {
		gap: 1.25rem;
		padding-top: 0.5rem;
	}
</style>
