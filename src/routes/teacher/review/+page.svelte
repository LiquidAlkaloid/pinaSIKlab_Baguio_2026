<script lang="ts">
	// Comment on a student's first draft with the comment bank (#5). Select words in the draft to
	// point a comment at them, then insert a saved comment in one click or write a new one.
	// The sample first-round comments are the ones every demo student already has.
	import TagPicker from '#lib/components/TagPicker.svelte';
	import {
		classmates,
		criterionName,
		errorLabel,
		feedbackRound,
		rubricCriteria,
		sampleDrafts,
		student
	} from '#lib/data.ts';
	import { course, demo, snapshotFor } from '#lib/state.svelte.ts';
	import { addComment, addToBank, bankFor, desk, removeComment, saved } from '#lib/teacher.svelte.ts';

	const people = [student, ...classmates.map((c) => c.student)];
	const who = $derived(people.find((p) => p.id === desk.student_id) ?? student);
	const isLive = $derived(who.id === student.id);
	const liveDraft = $derived(snapshotFor(demo, course.stages[0])?.content_text ?? null);
	const draft = $derived(isLive && liveDraft ? liveDraft : sampleDrafts.first_draft);

	const feedbackItems = feedbackRound(1);
	const first = feedbackItems.length + 1;
	const mine = $derived(saved.comments[who.id] ?? []);

	// Words the next comment points at.
	let anchor: string | null = $state(null);
	let draftEl: HTMLElement | undefined = $state();

	function readSelection() {
		const sel = getSelection();
		if (!sel || sel.isCollapsed || !draftEl?.contains(sel.anchorNode)) return;
		const text = sel.toString().trim();
		if (text) anchor = text;
	}

	// Writing a new comment.
	let body = $state('');
	let criterionId: string | null = $state(rubricCriteria[0].id);
	let tag: string | null = $state(null);
	let keep = $state(false);

	function write() {
		addComment(who.id, first, { body: body.trim(), criterion_id: criterionId, error_type_id: tag, anchor_excerpt: anchor });
		if (keep) addToBank(body, criterionId, tag);
		body = '';
		tag = null;
		keep = false;
		anchor = null;
	}

	// The bank.
	let filter: string | null = $state(null);
	let search = $state('');
	const bank = $derived(bankFor(filter, search));

	function insert(id: string) {
		const e = saved.bank.find((b) => b.id === id)!;
		addComment(who.id, first, { body: e.body, criterion_id: e.criterion_id, error_type_id: e.error_type_id, anchor_excerpt: anchor }, e.id);
		anchor = null;
	}
</script>

<svelte:head><title>Comment on {who.full_name} · MYRACLE</title></svelte:head>

<div class="head">
	<div>
		<a class="small" href="/teacher">← Teacher home</a>
		<h1>Comment on {who.full_name}’s first draft</h1>
	</div>
	<label class="field pick small">
		Student
		<select bind:value={desk.student_id}>
			{#each people as p (p.id)}<option value={p.id}>{p.full_name}</option>{/each}
		</select>
	</label>
</div>

<div class="layout">
	<div class="stack">
		<section class="card stack">
			<h2>Draft 1</h2>
			{#if isLive && !liveDraft}
				<p class="small muted">Bea hasn’t handed in her first draft yet. This is the sample draft.</p>
			{/if}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<p class="draft" bind:this={draftEl} onmouseup={readSelection} onkeyup={readSelection}>{draft}</p>
			<p class="small muted">Select words in the draft to point your next comment at them.</p>
		</section>

		<section class="card stack">
			<h2>Comments on this draft <span class="muted small">{feedbackItems.length + mine.length}</span></h2>
			<ol class="comments">
				{#each feedbackItems as item (item.id)}
					<li class="comment sent">
						<span class="num">{item.number}</span>
						<div class="stack tight">
							{#if item.anchor_excerpt}<blockquote>“{item.anchor_excerpt}”</blockquote>{/if}
							<p class="pen">{item.body}</p>
							<p class="tags">
								<span class="pill pill-brand">{criterionName(item.criterion_id)}</span>
								<span class="pill">{errorLabel(item.error_type_id)}</span>
								<span class="small muted">Sample comment, already sent</span>
							</p>
						</div>
					</li>
				{/each}
				{#each mine as c (c.id)}
					<li class="comment">
						<span class="num">{c.number}</span>
						<div class="stack tight">
							{#if c.anchor_excerpt}<blockquote>“{c.anchor_excerpt}”</blockquote>{/if}
							<p class="pen">{c.body}</p>
							<p class="tags">
								{#if c.criterion_id}<span class="pill pill-brand">{criterionName(c.criterion_id)}</span>{/if}
							</p>
							<TagPicker bind:value={c.error_type_id} />
						</div>
						<button class="btn btn-ghost btn-small" onclick={() => removeComment(who.id, first, c.id)}>Remove</button>
					</li>
				{/each}
			</ol>
			{#if mine.length > 0}
				<p class="small muted">
					Your new comments are saved here and show in {who.full_name}’s details on Teacher home. In this
					prototype the student screens still show the {feedbackItems.length} sample comments.
				</p>
			{/if}
		</section>
	</div>

	<aside class="side stack">
		<section class="card stack">
			<h2>Write a comment</h2>
			{#if anchor}
				<div class="anchor small">
					<span>Points at: “{anchor}”</span>
					<button class="link" onclick={() => (anchor = null)}>Clear</button>
				</div>
			{/if}
			<textarea rows="2" bind:value={body} aria-label="Comment" placeholder="Write it, or insert one from the bank below"></textarea>
			<label class="field small">
				Rubric criterion
				<select bind:value={criterionId}>
					{#each rubricCriteria as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
					<option value={null}>No criterion</option>
				</select>
			</label>
			<TagPicker bind:value={tag} />
			<label class="keep small">
				<input type="checkbox" bind:checked={keep} /> Also save it to my comment bank
			</label>
			<button class="btn btn-primary" disabled={body.trim().length < 3} onclick={write}>Add comment</button>
		</section>

		<section class="card stack">
			<div class="bank-head">
				<h2>Comment bank</h2>
				<a class="small" href="/teacher/bank">Manage</a>
			</div>
			<input type="text" bind:value={search} placeholder="Search" aria-label="Search the comment bank" />
			<select bind:value={filter} aria-label="Rubric criterion">
				<option value={null}>All criteria</option>
				{#each rubricCriteria as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
			</select>
			<ul class="bank">
				{#each bank as e (e.id)}
					<li>
						<button class="insert" onclick={() => insert(e.id)} title="Insert this comment">
							<span class="body">{e.body}</span>
							<span class="small muted">
								{criterionName(e.criterion_id) || 'No criterion'} · {errorLabel(e.error_type_id) || 'No tag'}
							</span>
						</button>
					</li>
				{:else}
					<li class="small muted">Nothing matches.</li>
				{/each}
			</ul>
			<p class="small muted">One click adds the comment{anchor ? ' to the selected words' : ''}.</p>
		</section>
	</aside>
</div>

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}
	.head h1 {
		margin-top: 0.25rem;
	}
	.pick {
		min-width: 14rem;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 24rem;
		gap: 1.25rem;
		align-items: start;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	.side {
		position: sticky;
		top: 5rem;
		gap: 1rem;
	}
	@media (max-width: 900px) {
		.side {
			position: static;
		}
	}
	.draft {
		font-size: 1.05rem;
		line-height: 1.75;
		padding: 1rem 1.1rem;
		background: #fcfbf8;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
	}
	.draft::selection {
		background: #f6d3cf;
	}
	.comments {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.comment {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.75rem;
		align-items: start;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--line);
	}
	.comment:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}
	.comment.sent {
		opacity: 0.8;
	}
	.num {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--ink);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 700;
	}
	.tight {
		gap: 0.4rem;
	}
	blockquote {
		margin: 0;
		padding: 0.4rem 0.7rem;
		background: var(--sunken);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}
	.anchor {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.5rem 0.7rem;
		background: #fbeceb;
		border-radius: var(--radius-sm);
		color: var(--pen);
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		font: inherit;
		font-weight: 700;
		color: var(--brand-2);
		cursor: pointer;
	}
	.keep {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.keep input {
		accent-color: var(--brand);
	}
	.bank-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.bank {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		max-height: 24rem;
		overflow-y: auto;
	}
	.insert {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		padding: 0.55rem 0.7rem;
		border: 1.5px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		font: inherit;
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}
	.insert:hover {
		border-color: var(--pen);
	}
	.insert .body {
		font-family: var(--hand);
		color: var(--pen);
		font-size: 1.2rem;
		line-height: 1.15;
		font-weight: 600;
	}
</style>
