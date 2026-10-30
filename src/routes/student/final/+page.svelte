<script lang="ts">
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { sampleDrafts, steps } from '#lib/data.ts';
	import { demo, snapshotFor } from '#lib/state.svelte.ts';

	const step = steps[3];
	const revised = $derived(snapshotFor(demo, steps[2].stage));
	const done = $derived(snapshotFor(demo, step.stage));
</script>

<svelte:head><title>Step 4: Final · MYRACLE</title></svelte:head>

<StepHeader n={4} title="Hand in your final essay" next="see how you did" />

{#if !revised}
	<Locked what="Answer your teacher’s comments and hand in Draft 2 first." href="/student/feedback" />
{:else if done}
	<div class="card stack done">
		<span class="pill pill-ok">Handed in</span>
		<h2>Final essay</h2>
		<p class="muted">
			Your teacher grades your essay and how you worked on it. When grades are out, you see the same
			report your teacher saw.
		</p>
		<a class="btn btn-primary btn-block" href="/student/mirror">See how you did</a>
		<p class="muted small">In class, this opens when your teacher releases grades. The demo skips the wait.</p>
	</div>
{:else}
	<div class="goal">
		<p class="goal-label">Teacher’s goal for the final</p>
		<p>{step.goal}</p>
	</div>
	<HandIn {step} sampleName="Position paper – Final" sampleText={sampleDrafts.final} onsubmit={() => {}} />
{/if}

<style>
	.done {
		align-items: flex-start;
	}
</style>
