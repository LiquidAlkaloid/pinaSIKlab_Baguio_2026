<script lang="ts">
	import { goto } from '$app/navigation';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { assignment } from '#lib/data.ts';
	import { demo } from '#lib/state.svelte.ts';

	const MIN_WORDS = 30;
	const step = assignment.steps[0];
	const words = $derived(demo.summary.trim().split(/\s+/).filter(Boolean).length);

	function save() {
		demo.readAt = Date.now();
		goto('/student/draft');
	}
</script>

<svelte:head><title>Step 1: Read · MYRACLE</title></svelte:head>

<StepHeader n={1} title="Read the article first" next="write your first draft" />

<div class="card how stack">
	<p class="small"><span class="pill">No AI on this step</span></p>
	<ol>
		<li>Read the whole article below.</li>
		<li>Write what it says in your own words, in 3 to 5 sentences.</li>
	</ol>
</div>

<article class="card source">
	<h2>{assignment.source.title}</h2>
	<p class="small muted byline">{assignment.source.byline}</p>
	{#each assignment.source.paragraphs as p, i (i)}
		<p class="para"><span class="pnum">¶{i + 1}</span>{p}</p>
	{/each}
</article>

<section class="card stack">
	<label class="field" for="summary">Your summary</label>
	<p class="muted small">What is the article saying? You will cite its paragraphs (¶) in your essay.</p>
	<textarea id="summary" rows="7" bind:value={demo.summary} placeholder="The article says that…"></textarea>
	<p class="small" class:muted={words < MIN_WORDS}>
		{words} words{#if words < MIN_WORDS} · write at least {MIN_WORDS}{:else} · looks good{/if}
	</p>
</section>

<button class="btn btn-primary btn-block" disabled={words < MIN_WORDS} onclick={save}>
	{demo.readAt ? 'Save changes' : 'Save summary'}
</button>
<p class="muted small center">Due {new Date(step.due).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}</p>

<style>
	.how ol {
		margin: 0;
		padding-left: 1.25rem;
	}
	.source {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.byline {
		margin-top: -0.5rem;
	}
	.para {
		line-height: 1.65;
	}
	.pnum {
		display: inline-block;
		min-width: 2rem;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--ink-3);
	}
	.center {
		text-align: center;
	}
</style>
