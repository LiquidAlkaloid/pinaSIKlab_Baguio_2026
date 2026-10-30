<script lang="ts">
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { feedbackItems, sampleDrafts, steps } from '#lib/data.ts';
	import { demo, snapshotFor } from '#lib/state.svelte.ts';

	const step = steps[1];
	const done = $derived(snapshotFor(demo, step.stage));
	let justSent = $state(false);
</script>

<svelte:head><title>Step 2: Draft · MYRACLE</title></svelte:head>

<StepHeader n={2} title="Hand in your first draft" next="your teacher comments on it" />

{#if !demo.reading.saved_at}
	<Locked what="Read the article and write your summary first." href="/student/read" />
{:else if done}
	<div class="card stack done">
		<span class="pill pill-ok">{justSent ? 'Handed in' : 'Already handed in'}</span>
		<h2>Draft 1</h2>
		<p class="muted">
			Your teacher left {feedbackItems.length} comments on it. Tell your teacher what you did with
			each one.
		</p>
		<a class="btn btn-primary btn-block" href="/student/feedback">See the comments</a>
		<p class="muted small">In class, comments arrive after your teacher reviews. The demo skips the wait.</p>
	</div>
{:else}
	<div class="goal">
		<p class="goal-label">Teacher’s goal for this draft</p>
		<p>{step.goal}</p>
	</div>
	<HandIn
		{step}
		sampleName="Position paper – Draft 1"
		sampleText={sampleDrafts.first_draft}
		onsubmit={() => (justSent = true)}
	/>
{/if}

<style>
	.done {
		align-items: flex-start;
	}
</style>
