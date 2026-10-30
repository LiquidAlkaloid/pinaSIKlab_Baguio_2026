<script lang="ts">
	// Feedback Uptake Map (#2): every teacher comment needs an answer.
	import { goto } from '$app/navigation';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { assignment, type Answer } from '#lib/data.ts';
	import { demo, type FeedbackAnswer } from '#lib/state.svelte.ts';

	const OPTIONS: { value: Answer; label: string }[] = [
		{ value: 'fixed', label: 'I fixed it' },
		{ value: 'partly', label: 'I fixed part of it' },
		{ value: 'kept', label: 'I kept it the same' }
	];

	const paragraphs = assignment.source.paragraphs.map((_, i) => i + 1);

	function complete(a: FeedbackAnswer) {
		if (!a.status) return false;
		if (a.status === 'kept') return a.reason.trim().length >= 10;
		return a.paragraph !== null;
	}

	const doneCount = $derived(demo.answers.filter(complete).length);
	const total = assignment.feedback.length;

	function choose(a: FeedbackAnswer, value: Answer, defaultParagraph: number) {
		a.status = value;
		if (value !== 'kept' && a.paragraph === null) a.paragraph = defaultParagraph;
	}

	function finish() {
		demo.revisedAt = Date.now();
		goto('/student/final');
	}
</script>

<svelte:head><title>Step 3: Revise · MYRACLE</title></svelte:head>

<StepHeader n={3} title="Answer your teacher’s comments" next="hand in your final essay" />

{#if !demo.draft.at}
	<Locked what="Hand in your first draft first." href="/student/draft" />
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

	{#each assignment.feedback as item, i (item.n)}
		{@const a = demo.answers[i]}
		<section class="card stack item" class:complete={complete(a)}>
			<div class="item-head">
				<span class="num">{item.n}</span>
				<span class="pill">{item.tag}</span>
				<span class="small muted">¶{item.paragraph} of your draft</span>
			</div>
			<blockquote>“{item.quote}”</blockquote>
			<p class="pen">{item.comment}</p>

			<div class="options" role="radiogroup" aria-label="What did you do with comment {item.n}?">
				{#each OPTIONS as o (o.value)}
					<button
						class="opt {o.value}"
						role="radio"
						aria-checked={a.status === o.value}
						onclick={() => choose(a, o.value, item.paragraph)}>{o.label}</button
					>
				{/each}
			</div>

			{#if a.status === 'fixed' || a.status === 'partly'}
				<div class="follow stack">
					<label class="field">
						Where did you change it?
						<select bind:value={a.paragraph}>
							{#each paragraphs as p (p)}<option value={p}>Paragraph {p}</option>{/each}
						</select>
					</label>
					<label class="field">
						What did you change? <span class="muted small">(optional)</span>
						<input type="text" bind:value={a.note} placeholder="Example: rewrote my thesis as one sentence" />
					</label>
				</div>
			{:else if a.status === 'kept'}
				<label class="field follow">
					Why did you keep it?
					<textarea rows="3" bind:value={a.reason} placeholder="Example: This sentence is a quote from someone I interviewed."></textarea>
				</label>
			{/if}
		</section>
	{/each}

	<button class="btn btn-primary btn-block" disabled={doneCount < total} onclick={finish}>
		Done. Hand in my final essay
	</button>
	{#if doneCount < total}
		<p class="muted small center">Answer all {total} comments to continue.</p>
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
	.opt.fixed[aria-checked='true'] {
		background: var(--ok-soft);
		border-color: var(--ok);
		color: var(--ok);
	}
	.opt.partly[aria-checked='true'] {
		background: var(--gold-soft);
		border-color: var(--partly);
		color: #8a5d00;
	}
	.opt.kept[aria-checked='true'] {
		background: #e9edf5;
		border-color: var(--kept);
		color: var(--ink);
	}
	.follow {
		gap: 0.75rem;
		padding-top: 0.25rem;
	}
	.center {
		text-align: center;
	}
</style>
