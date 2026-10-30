<script lang="ts">
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import RevisionMeter from '#lib/components/RevisionMeter.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { feedbackRound, revisionCount, sampleDrafts } from '#lib/data.ts';
	import { course, courseSteps, demo, snapshotFor } from '#lib/state.svelte.ts';

	const step = $derived(courseSteps()[1]);
	const total = $derived(revisionCount(course.stages));
	const done = $derived(snapshotFor(demo, step.stage));
	let justSent = $state(false);
</script>

<svelte:head><title>Draft · MYRACLE</title></svelte:head>

<StepHeader n={step.n} title="Hand in your first draft" next="your teacher comments on it" />

{#if !demo.reading.saved_at}
	<Locked what="Read the article and write your summary first." href="/student/read" />
{:else if done}
	<div class="card stack done">
		<span class="pill pill-ok">{justSent ? 'Handed in' : 'Already handed in'}</span>
		<h2>First draft</h2>
		<p class="muted">
			Your teacher left {feedbackRound(1).length} comments on it. Tell your teacher what you did with
			each one.
		</p>
		<a class="btn btn-primary btn-block" href="/student/revise/1">See the comments</a>
		<p class="muted small">In class, comments arrive after your teacher reviews. The demo skips the wait.</p>
	</div>
{:else}
	<RevisionMeter current={0} {total} />
	<div class="goal">
		<p class="goal-label">Teacher’s goal for this draft</p>
		<p>{step.goal}</p>
	</div>
	<HandIn
		{step}
		what="draft"
		sampleName="Position paper – First draft"
		sampleText={sampleDrafts.first_draft}
		onsubmit={() => (justSent = true)}
	/>
{/if}

<style>
	.done {
		align-items: flex-start;
	}
</style>
