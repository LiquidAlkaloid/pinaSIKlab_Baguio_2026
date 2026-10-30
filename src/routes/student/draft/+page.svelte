<script lang="ts">
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { assignment } from '#lib/data.ts';
	import { demo } from '#lib/state.svelte.ts';

	const step = assignment.steps[1];
	let justSent = $state(false);
</script>

<svelte:head><title>Step 2: Draft · MYRACLE</title></svelte:head>

<StepHeader n={2} title="Hand in your first draft" next="your teacher comments on it" />

{#if !demo.readAt}
	<Locked what="Read the article and write your summary first." href="/student/read" />
{:else if demo.draft.at}
	<div class="card stack done">
		<span class="pill pill-ok">{justSent ? 'Handed in' : 'Already handed in'}</span>
		<h2>{demo.draft.file}</h2>
		<p class="muted">
			Your teacher left {assignment.feedback.length} comments on it. Tell your teacher what you did
			with each one.
		</p>
		<a class="btn btn-primary btn-block" href="/student/feedback">See the comments</a>
		<p class="muted small">In class, comments arrive after your teacher reviews. The demo skips the wait.</p>
	</div>
{:else}
	<div class="goal">
		<p class="goal-label">Teacher’s goal for this draft</p>
		<p>{step.goal}</p>
	</div>
	<HandIn {step} sub={demo.draft} sampleName="Position paper – Draft 1" onsubmit={() => (justSent = true)} />
{/if}

<style>
	.done {
		align-items: flex-start;
	}
</style>
