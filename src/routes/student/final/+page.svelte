<script lang="ts">
	import HandIn from '#lib/components/HandIn.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { assignment } from '#lib/data.ts';
	import { demo } from '#lib/state.svelte.ts';

	const step = assignment.steps[3];
</script>

<svelte:head><title>Step 4: Final · MYRACLE</title></svelte:head>

<StepHeader n={4} title="Hand in your final essay" next="see how you did" />

{#if !demo.revisedAt}
	<Locked what="Answer your teacher’s comments first." href="/student/feedback" />
{:else if demo.final.at}
	<div class="card stack done">
		<span class="pill pill-ok">Handed in</span>
		<h2>{demo.final.file}</h2>
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
	<HandIn {step} sub={demo.final} sampleName="Position paper – Final" onsubmit={() => {}} />
{/if}

<style>
	.done {
		align-items: flex-start;
	}
</style>
