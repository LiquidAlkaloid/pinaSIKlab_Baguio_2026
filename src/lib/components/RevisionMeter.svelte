<script lang="ts">
	// How many times the student may revise, which revision this is, and whether the teacher
	// comments again afterwards. `current` is 0 on the first draft.
	let { current, total }: { current: number; total: number } = $props();

	const last = $derived(current === total);
	const left = $derived(total - current);
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
</script>

<section class="meter" aria-label="Revisions">
	<div class="top">
		<p class="title">
			{#if current === 0}
				Your teacher allows {plural(total, 'revision')}
			{:else}
				Revision {current} of {total}
			{/if}
		</p>
		{#if current === 0 || !last}
			<span class="pill pill-gold">Teacher feedback next</span>
		{:else}
			<span class="pill pill-ok">Final: no more feedback</span>
		{/if}
	</div>

	<ol class="dots">
		{#each Array(total) as _, i (i)}
			{@const n = i + 1}
			<li class:done={n < current} class:now={n === current}>
				<span class="dot"></span>
				<span class="small">{n === total ? 'Final' : `Revision ${n}`}</span>
			</li>
		{/each}
	</ol>

	<p class="small">
		{#if current === 0}
			{total === 1
				? 'Your teacher comments on this draft once. Your next hand-in is your final essay.'
				: `Your teacher comments on this draft and on each revision. Revision ${total} is your final essay.`}
		{:else if !last}
			After this, your teacher comments on this revision. You have {plural(left, 'more revision')} after this
			one{left === 1 ? ', and that one is your final essay' : `; the last is your final essay`}.
		{:else}
			This is your last revision. What you hand in here is your final essay, so answer every comment carefully.
		{/if}
	</p>
</section>

<style>
	.meter {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.85rem 1rem;
		border: 1.5px solid var(--brand-soft);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.title {
		font-weight: 700;
	}
	.dots {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: 0.3rem;
	}
	.dots li {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: var(--ink-3);
	}
	.dot {
		height: 8px;
		border-radius: 999px;
		background: var(--line);
	}
	.done .dot {
		background: var(--brand-2);
	}
	.now .dot {
		background: var(--gold);
	}
	.now {
		color: var(--ink);
		font-weight: 700;
	}
</style>
