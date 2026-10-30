<script lang="ts">
	// Feedback Uptake Map (#2): every teacher comment needs an answer, then Draft 2 shows the changes.
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { errorLabel, feedbackItems, sampleDrafts, steps, type ResolutionAction } from '#lib/data.ts';
	import { demo, resolutionReady, snapshotFor, type FeedbackResolution } from '#lib/state.svelte.ts';

	const OPTIONS: { value: ResolutionAction; label: string }[] = [
		{ value: 'addressed', label: 'I fixed it' },
		{ value: 'partly_addressed', label: 'I fixed part of it' },
		{ value: 'declined', label: 'I kept it the same' }
	];

	const step = steps[2];
	const firstDraft = $derived(snapshotFor(demo, steps[1].stage));
	const done = $derived(snapshotFor(demo, step.stage));
	const doneCount = $derived(demo.feedback_resolutions.filter(resolutionReady).length);
	const total = feedbackItems.length;

	const choose = (r: FeedbackResolution, value: ResolutionAction) => (r.action = value);
</script>

<svelte:head><title>Step 3: Revise · MYRACLE</title></svelte:head>

<StepHeader n={3} title="Answer your teacher’s comments" next="hand in your final essay" />

{#if !firstDraft}
	<Locked what="Hand in your first draft first." href="/student/draft" />
{:else if done}
	<div class="card stack handed">
		<span class="pill pill-ok">Draft 2 handed in</span>
		<p class="muted">You answered all {total} comments. Your answers point to Draft 2, where the changes are.</p>
		<a class="btn btn-primary btn-block" href="/student/final">Hand in my final essay</a>
	</div>
{:else}
	<div class="card stack intro">
		<p>
			For each comment, tell your teacher what you did. <strong>Keeping something is okay</strong> if
			you say why. A good reason counts as much as a fix.
		</p>
		<p class="progress small">
			<span class="pill" class:pill-ok={doneCount === total}>{doneCount} of {total} answered</span>
		</p>
	</div>

	{#each feedbackItems as item, i (item.id)}
		{@const r = demo.feedback_resolutions[i]}
		<section class="card stack item" class:complete={resolutionReady(r)}>
			<div class="item-head">
				<span class="num">{item.number}</span>
				<span class="pill">{errorLabel(item.error_type_id)}</span>
				{#if item.anchor_page}<span class="small muted">page {item.anchor_page} of your draft</span>{/if}
			</div>
			<blockquote>“{item.anchor_excerpt}”</blockquote>
			<p class="pen">{item.body}</p>

			<div class="options" role="radiogroup" aria-label="What did you do with comment {item.number}?">
				{#each OPTIONS as o (o.value)}
					<button class="opt {o.value}" role="radio" aria-checked={r.action === o.value} onclick={() => choose(r, o.value)}
						>{o.label}</button
					>
				{/each}
			</div>

			{#if r.action === 'addressed' || r.action === 'partly_addressed'}
				<label class="field follow">
					What did you change?
					<input type="text" bind:value={r.changed_excerpt} placeholder="Example: rewrote my position as one sentence" />
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

	{#if doneCount < total}
		<p class="muted small center">Answer all {total} comments, then hand in Draft 2.</p>
	{:else}
		<h2 class="part">Now hand in Draft 2 with your changes</h2>
		<div class="goal">
			<p class="goal-label">Teacher’s goal for this draft</p>
			<p>{step.goal}</p>
		</div>
		<HandIn {step} sampleName="Position paper – Draft 2" sampleText={sampleDrafts.revision} onsubmit={() => {}} />
	{/if}
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
	.handed {
		align-items: flex-start;
	}
	.center {
		text-align: center;
	}
</style>
