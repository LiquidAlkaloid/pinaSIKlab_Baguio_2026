<script lang="ts">
	let { size = 28, tagline = false }: { size?: number; tagline?: boolean } = $props();
</script>

<span class="logo">
	<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
		<rect width="32" height="32" rx="8" fill="var(--brand)" />
		<rect x="6" y="19" width="5" height="7" rx="1.5" fill="#fff" />
		<rect x="13.5" y="13" width="5" height="13" rx="1.5" fill="#fff" />
		<rect x="21" y="7" width="5" height="19" rx="1.5" fill="#fff" />
		<circle cx="23.5" cy="4.5" r="2.5" fill="var(--gold)" />
	</svg>
	<span class="text">
		<span class="name">MYRACLE</span>
		{#if tagline}<span class="tagline">Every step counts.</span>{/if}
	</span>
</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
	}
	.text {
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}
	.name {
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--brand);
	}
	.tagline {
		font-size: 0.85rem;
		color: var(--ink-2);
	}
</style>
