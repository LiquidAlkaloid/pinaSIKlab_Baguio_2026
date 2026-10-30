<script lang="ts">
	import { assignment } from '#lib/data.ts';

	let { n, title, next }: { n: number; title: string; next?: string } = $props();
	const steps = assignment.steps;
</script>

<header class="step-header">
	<ol class="bar" aria-label="Steps">
		{#each steps as s (s.key)}
			<li class:done={s.n < n} class:current={s.n === n} aria-current={s.n === n ? 'step' : undefined}>
				<span class="dot"></span>
				<span class="label">{s.name}</span>
			</li>
		{/each}
	</ol>
	<p class="kicker">Step {n} of {steps.length}</p>
	<h1>{title}</h1>
	{#if next}<p class="muted small">Next: {next}</p>{/if}
</header>

<style>
	.step-header {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.bar {
		list-style: none;
		margin: 0 0 0.75rem;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.3rem;
	}
	.bar li {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.dot {
		height: 6px;
		border-radius: 999px;
		background: var(--line);
	}
	.done .dot {
		background: var(--brand-2);
	}
	.current .dot {
		background: var(--gold);
	}
	.label {
		font-size: 0.72rem;
		color: var(--ink-3);
	}
	.current .label {
		color: var(--ink);
		font-weight: 700;
	}
	.kicker {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--gold);
	}
</style>
