<script lang="ts">
	// Revision k of N. Feedback Uptake Map (#2): every comment on the last draft needs an answer,
	// then the student hands in the next draft. The last revision is the final essay.
	import { page } from '$app/state';
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import RevisionMeter from '#lib/components/RevisionMeter.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { errorLabel, feedbackRound, revisionCount, sampleDrafts, type ResolutionAction } from '#lib/data.ts';
	import {
		course,
		courseSteps,
		demo,
		draftChanges,
		itemsFor,
		resolutionReady,
		roundOf,
		saveDocument,
		snapshotFor,
		type FeedbackResolution
	} from '#lib/state.svelte.ts';
	import type { FeedbackItem } from '#lib/data.ts';

	const OPTIONS: { value: ResolutionAction; label: string }[] = [
		{ value: 'addressed', label: 'I fixed it' },
		{ value: 'partly_addressed', label: 'I fixed part of it' },
		{ value: 'declined', label: 'I kept it the same' }
	];

	const k = $derived(Number(page.params.n));
	const total = $derived(revisionCount(course.stages));
	const last = $derived(k === total);
	const step = $derived(courseSteps().find((s) => s.revision === k));

	// The comments are on Draft k; this revision hands in Draft k + 1 (or the final).
	const commented = $derived(snapshotFor(demo, course.stages[k - 1] ?? null));
	const done = $derived(snapshotFor(demo, course.stages[k] ?? null));
	// Includes comments the teacher raised again after not accepting a "kept it" reason.
	const items = $derived(itemsFor(demo, k));
	const earlierReason = (item: { redo_of?: string }) =>
		demo.feedback_resolutions.find((r) => r.feedback_item_id === item.redo_of)?.decline_reason ?? '';
	const answers = $derived(roundOf(demo, k));
	const answerFor = (id: string) => answers.find((r) => r.feedback_item_id === id)!;
	const anchorOf = (r: FeedbackResolution) => items.find((i) => i.id === r.feedback_item_id)?.anchor_excerpt ?? null;
	const doneCount = $derived(answers.filter((r) => resolutionReady(r, anchorOf(r))).length);
	// Live list of what changed since Draft k, from the comment cards and direct edits.
	const changes = $derived(draftChanges(demo, course.stages, k));

	const what = $derived(last ? 'final essay' : `Revision ${k}`);
	/** The hand-in the comments are on: the first draft, or the revision before this one. */
	const commentedOn = $derived(k === 1 ? 'your first draft' : `Revision ${k - 1}`);
	const lockedHref = $derived(k === 1 ? '/student/draft' : `/student/revise/${k - 1}`);

	/** The words on the card right now: the student's rewrite, or the words the teacher marked. */
	const current = (r: FeedbackResolution, item: FeedbackItem) => r.changed_excerpt || item.anchor_excerpt || '';
	const inDraft = (text: string) => !!text && demo.document.content.includes(text);

	function choose(r: FeedbackResolution, item: FeedbackItem, value: ResolutionAction) {
		// Keeping it the same undoes a rewrite made on this card, so the draft matches the answer.
		if (value === 'declined' && r.changed_excerpt && item.anchor_excerpt && inDraft(r.changed_excerpt)) {
			saveDocument(demo.document.content.replace(r.changed_excerpt, item.anchor_excerpt));
			r.changed_excerpt = '';
		}
		r.action = value;
	}

	/** A rewrite on the card goes straight into the draft. */
	function rewrite(r: FeedbackResolution, before: string, e: Event) {
		const after = (e.currentTarget as HTMLTextAreaElement).value;
		if (!after.trim()) return;
		saveDocument(demo.document.content.replace(before, after));
		r.changed_excerpt = after;
	}
</script>

<svelte:head><title>{last ? 'Final' : `Revision ${k}`} · MYRACLE</title></svelte:head>

{#if !step}
	<div class="card stack">
		<h1>No revision {k}</h1>
		<p class="muted">Your teacher set {total} revision{total === 1 ? '' : 's'} for this assignment.</p>
		<a class="btn btn-primary" href="/student">Back to home</a>
	</div>
{:else}
	<StepHeader
		n={step.n}
		title={last ? 'Answer the comments and hand in your final essay' : `Answer the comments and hand in Revision ${k}`}
		next={last ? 'see how you did' : `your teacher comments on Revision ${k}`}
	/>

	{#key k}
		{#if !commented}
			<Locked what={k === 1 ? 'Hand in your first draft first.' : `Finish revision ${k - 1} first.`} href={lockedHref} />
		{:else if done}
			<div class="card stack handed">
				<span class="pill pill-ok">{last ? 'Final essay handed in' : `Revision ${k} handed in`}</span>
				{#if last}
					<p class="muted">
						That was your last revision. Your teacher grades your essay and how you worked on it. When
						grades are out, you see the same report your teacher saw.
					</p>
					<a class="btn btn-primary btn-block" href="/student/mirror">See how you did</a>
					<p class="muted small">In class, this opens when your teacher releases grades. The demo skips the wait.</p>
				{:else}
					<p class="muted">
						Your teacher left {itemsFor(demo, k + 1).length} comments on Revision {k}. Revision {k + 1} of {total}
						is next.
					</p>
					<a class="btn btn-primary btn-block" href="/student/revise/{k + 1}">See the comments</a>
					<p class="muted small">In class, comments arrive after your teacher reviews. The demo skips the wait.</p>
				{/if}
			</div>
		{:else}
			<RevisionMeter current={k} {total} />

			<div class="card stack intro">
				<p>
					Your teacher left {items.length} comments on {commentedOn}. For each one, tell your teacher what you did.
					<strong>Keeping something is okay</strong> if you say why. A good reason counts as much as a fix.
				</p>
				<p class="progress small">
					<span class="pill" class:pill-ok={doneCount === items.length}>{doneCount} of {items.length} answered</span>
				</p>
			</div>

			{#each items as item (item.id)}
				{@const r = answerFor(item.id)}
				{@const words = current(r, item)}
				<section class="card stack item" class:complete={resolutionReady(r, item.anchor_excerpt)}>
					<div class="item-head">
						<span class="num">{item.number}</span>
						{#if item.redo_of}<span class="pill pill-gold">Raised again</span>{/if}
						<span class="pill">{errorLabel(item.error_type_id)}</span>
						{#if item.anchor_page && !item.redo_of}<span class="small muted">page {item.anchor_page} of {commentedOn}</span>{/if}
					</div>
					{#if item.redo_of}
						<div class="again small">
							<p>Your teacher read why you kept this last time and wants you to look at it again.</p>
							<p class="muted">Your reason last time: “{earlierReason(item)}”</p>
						</div>
					{/if}
					<blockquote>“{item.anchor_excerpt}”</blockquote>
					<p class="pen">{item.body}</p>

					<div class="options" role="radiogroup" aria-label="What did you do with comment {item.number}?">
						{#each OPTIONS as o (o.value)}
							<button class="opt {o.value}" role="radio" aria-checked={r.action === o.value} onclick={() => choose(r, item, o.value)}
								>{o.label}</button
							>
						{/each}
					</div>

					{#if (r.action === 'addressed' || r.action === 'partly_addressed') && inDraft(words)}
						<label class="field follow">
							Change it here. Your draft updates as you type.
							<textarea rows="3" value={words} oninput={(e) => rewrite(r, words, e)}></textarea>
						</label>
					{:else if r.action === 'addressed' || r.action === 'partly_addressed'}
						<p class="small hint">
							These words are not in your draft as they were. Make the change in your draft below, then say
							what it reads now.
						</p>
						<label class="field follow">
							What does it say now?
							<input type="text" bind:value={r.changed_excerpt} placeholder="Example: my new first sentence" />
						</label>
					{:else if r.action === 'declined'}
						<label class="field follow">
							Why did you keep it?
							<textarea rows="3" bind:value={r.decline_reason} placeholder="Example: This sentence is a quote from someone I interviewed."
							></textarea>
						</label>
					{/if}
				</section>
			{/each}

			{#if doneCount < items.length}
				<p class="muted small center">Answer all {items.length} comments, then hand in your {what}.</p>
			{:else}
				<h2 class="part">Now hand in your {what}</h2>
				<div class="goal">
					<p class="goal-label">Teacher’s goal for this {last ? 'final' : 'revision'}</p>
					<p>{step.goal}</p>
				</div>
				<HandIn
					{step}
					{what}
					sampleName={last ? 'Position paper – Final' : `Position paper – Revision ${k}`}
					sampleText={last ? sampleDrafts.final : sampleDrafts.revision}
					{changes}
					onsubmit={() => {}}
				/>
			{/if}
		{/if}
	{/key}
{/if}

<style>
	.intro {
		gap: 0.6rem;
	}
	.item {
		gap: 0.75rem;
		border-left: 4px solid var(--line);
		transition: border-color 200ms var(--ease);
	}
	.item.complete {
		border-left-color: var(--ok);
	}
	.item-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
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
	blockquote {
		margin: 0;
		padding: 0.6rem 0.8rem;
		background: var(--sunken);
		border-radius: var(--radius-sm);
		text-decoration: underline wavy var(--pen) 1px;
		text-underline-offset: 4px;
	}
	.options {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.4rem;
	}
	.opt {
		min-height: 52px;
		padding: 0.5rem;
		border-radius: var(--radius-sm);
		border: 1.5px solid var(--line);
		background: var(--surface);
		font: inherit;
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--ink-2);
		cursor: pointer;
		transition:
			transform 160ms var(--ease),
			background-color 160ms var(--ease),
			border-color 160ms var(--ease);
	}
	.opt:active {
		transform: scale(0.97);
	}
	.opt.addressed[aria-checked='true'] {
		background: var(--ok-soft);
		border-color: var(--ok);
		color: var(--ok);
	}
	.opt.partly_addressed[aria-checked='true'] {
		background: var(--gold-soft);
		border-color: var(--partly);
		color: #8a5d00;
	}
	.opt.declined[aria-checked='true'] {
		background: #e9edf5;
		border-color: var(--kept);
		color: var(--ink);
	}
	.follow {
		padding-top: 0.25rem;
	}
	.part {
		margin-top: 0.75rem;
	}
	.again {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.6rem 0.75rem;
		background: var(--gold-soft);
		border-radius: var(--radius-sm);
	}
	.hint {
		background: var(--gold-soft);
		border-radius: var(--radius-sm);
		padding: 0.6rem 0.75rem;
	}
	.handed {
		align-items: flex-start;
	}
	.center {
		text-align: center;
	}
</style>
