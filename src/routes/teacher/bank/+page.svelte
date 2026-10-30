<script lang="ts">
	// Comment bank (#5): reusable comments linked to a rubric criterion and tagged with an
	// error type. Inserted in one click on the Review screen. The tags are what later let
	// MYRACLE turn each student's recurring errors into practice.
	import TagPicker from '#lib/components/TagPicker.svelte';
	import { criterionName, errorLabel, rubricCriteria } from '#lib/data.ts';
	import { addToBank, bankFor, removeFromBank, saved } from '#lib/teacher.svelte.ts';

	let body = $state('');
	let criterionId: string | null = $state(rubricCriteria[0].id);
	let tag: string | null = $state(null);
	let justAdded = $state(false);

	let filter: string | null = $state(null);
	let search = $state('');
	let deleting: string | null = $state(null);

	const shown = $derived(bankFor(filter, search));
	const countFor = (id: string | null) => saved.bank.filter((e) => !id || e.criterion_id === id).length;
	const canAdd = $derived(body.trim().length >= 3);

	function add() {
		addToBank(body, criterionId, tag);
		body = '';
		tag = null;
		justAdded = true;
	}
</script>

<svelte:head><title>Comment bank · MYRACLE</title></svelte:head>

<div class="wrap stack">
	<div>
		<h1>Comment bank</h1>
		<p class="muted">
			Save the comments you write again and again. When you comment on a draft, insert one in a single
			click. Each one is linked to a rubric criterion and tagged with the kind of error, so MYRACLE can
			later spot what each student keeps getting wrong.
		</p>
	</div>

	<section class="card stack">
		<h2>Save a new comment</h2>
		<label class="field">
			Comment
			<textarea rows="2" bind:value={body} oninput={() => (justAdded = false)} placeholder="Example: Says who? Point to a paragraph (¶) of the article."
			></textarea>
		</label>
		<div class="row">
			<label class="field">
				Rubric criterion
				<select bind:value={criterionId}>
					{#each rubricCriteria as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
					<option value={null}>No criterion</option>
				</select>
			</label>
			<div class="field-like">
				<span class="label">Error type</span>
				<TagPicker bind:value={tag} />
			</div>
		</div>
		<div class="actions">
			<button class="btn btn-primary" disabled={!canAdd} onclick={add}>Save to bank</button>
			{#if justAdded}<span class="pill pill-ok">Saved</span>{/if}
		</div>
	</section>

	<section class="stack">
		<div class="filters">
			<div class="chips" role="group" aria-label="Show comments for">
				<button class="chip" aria-pressed={filter === null} onclick={() => (filter = null)}>All {countFor(null)}</button>
				{#each rubricCriteria as c (c.id)}
					<button class="chip" aria-pressed={filter === c.id} onclick={() => (filter = c.id)}>{c.name} {countFor(c.id)}</button>
				{/each}
			</div>
			<input type="text" class="search" bind:value={search} placeholder="Search comments" aria-label="Search comments" />
		</div>

		{#if shown.length === 0}
			<p class="muted card">No saved comments here yet.</p>
		{:else}
			<ul class="list">
				{#each shown as e (e.id)}
					<li class="card entry">
						<p class="pen">{e.body}</p>
						<div class="meta">
							<div class="tags">
								{#if e.criterion_id}<span class="pill pill-brand">{criterionName(e.criterion_id)}</span>{/if}
								{#if e.error_type_id}<span class="pill">{errorLabel(e.error_type_id)}</span>{:else}<span class="pill pill-gold">No tag</span>{/if}
								<span class="small muted">used {e.use_count} {e.use_count === 1 ? 'time' : 'times'}</span>
							</div>
							{#if deleting === e.id}
								<span class="confirm small">
									Delete it?
									<button class="btn btn-ghost btn-small" onclick={() => removeFromBank(e.id)}>Delete</button>
									<button class="btn btn-ghost btn-small" onclick={() => (deleting = null)}>Keep</button>
								</span>
							{:else}
								<button class="btn btn-ghost btn-small" onclick={() => (deleting = e.id)}>Delete</button>
							{/if}
						</div>
						<details>
							<summary class="small">Change the tag</summary>
							<div class="retag"><TagPicker bind:value={e.error_type_id} /></div>
						</details>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.wrap {
		max-width: 52rem;
		margin: 0 auto;
		gap: 1.25rem;
	}
	h1 + p {
		margin-top: 0.4rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 1rem;
		align-items: start;
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
	.field-like {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.label {
		font-weight: 700;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.chip {
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		border: 1.5px solid var(--line);
		background: var(--surface);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-2);
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--brand-soft);
		border-color: var(--brand);
		color: var(--brand);
	}
	.search {
		max-width: 16rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.entry {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.85rem 1rem;
	}
	.entry .pen {
		font-size: 1.3rem;
	}
	.meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}
	.confirm {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	summary {
		cursor: pointer;
		color: var(--brand-2);
	}
	.retag {
		padding-top: 0.5rem;
	}
</style>
