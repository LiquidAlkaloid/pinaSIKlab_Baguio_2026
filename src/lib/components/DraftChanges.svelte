<script lang="ts">
	// The changes between two drafts, each labelled "Comment n" or "Your own change".
	import type { DraftChange } from '#lib/diff.ts';

	let {
		changes,
		own = 'Your own change',
		onlyOwn = false
	}: {
		/** null when a draft was uploaded instead of written in MYRACLE. */
		changes: DraftChange[] | null;
		/** Label for changes not tied to a comment ("Their own change" on the teacher side). */
		own?: string;
		onlyOwn?: boolean;
	} = $props();

	const shown = $derived(changes && (onlyOwn ? changes.filter((c) => !c.comment) : changes));
</script>

{#if !shown}
	<p class="small muted">Changes are listed only when both drafts are written in MYRACLE.</p>
{:else if shown.length === 0}
	<p class="small muted">{onlyOwn ? 'No changes of their own.' : 'No changes yet.'}</p>
{:else}
	<ul class="changes">
		{#each shown as c, i (i)}
			<li class:own={!c.comment}>
				<span class="pill {c.comment ? 'pill-brand' : 'pill-gold'}">{c.comment ? `Comment ${c.comment}` : own}</span>
				{#if c.kind !== 'added'}<del>{c.before}</del>{/if}
				{#if c.kind !== 'removed'}<ins>{c.after}</ins>{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.changes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.changes li {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding-left: 0.75rem;
		border-left: 3px solid var(--brand-2);
	}
	.changes li.own {
		border-color: var(--gold);
	}
	del {
		color: var(--ink-3);
		text-decoration-thickness: 1px;
	}
	ins {
		text-decoration: none;
		background: var(--ok-soft);
		border-radius: 4px;
		padding: 0 0.2rem;
	}
</style>
