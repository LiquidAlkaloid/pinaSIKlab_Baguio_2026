<script lang="ts">
	// One-click error type tag. Clicking the chosen tag again clears it.
	import { errorTypes } from '#lib/data.ts';

	let { value = $bindable(), label = 'Error type' }: { value: string | null; label?: string } = $props();
</script>

<div class="tags" role="radiogroup" aria-label={label}>
	{#each errorTypes as t (t.id)}
		<button
			type="button"
			role="radio"
			class="tag {t.code}"
			aria-checked={value === t.id}
			onclick={() => (value = value === t.id ? null : t.id)}>{t.label}</button
		>
	{/each}
</div>

<style>
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.tag {
		min-height: 32px;
		padding: 0.2rem 0.75rem;
		border-radius: 999px;
		border: 1.5px solid var(--line);
		background: var(--surface);
		font: inherit;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--ink-2);
		cursor: pointer;
	}
	.tag:hover {
		border-color: var(--brand-2);
	}
	.tag[aria-checked='true'] {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}
</style>
