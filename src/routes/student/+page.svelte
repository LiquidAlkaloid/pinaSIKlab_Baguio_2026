<script lang="ts">
	import { assignment, otherWork, student } from '#lib/data.ts';
	import { currentStep, demo, formatDate, resetDemo, stepNumber } from '#lib/state.svelte.ts';

	const step = $derived(currentStep(demo));
	const next = $derived(assignment.steps.find((s) => s.key === step));
	const n = $derived(stepNumber(demo));
</script>

<svelte:head><title>Home · MYRACLE</title></svelte:head>

<div class="stack hello">
	<h1>Hi, {student.first}</h1>
	<div class="goal">
		<p class="goal-label">Your goal from last time</p>
		<p>“{demo.lastGoal}”</p>
	</div>
</div>

<section class="card up-next stack">
	<p class="kicker">Up next · {assignment.course}</p>
	<h2>{assignment.title}</h2>

	<ol class="track" aria-label="Progress">
		{#each assignment.steps as s (s.key)}
			<li class:done={s.n < n} class:current={s.n === n}>{s.name}</li>
		{/each}
	</ol>

	{#if next}
		<div class="next">
			<p class="small muted">Step {next.n} of 5 · due {formatDate(next.due)}</p>
			<p class="action">{next.action}</p>
			{#if next.key === 'revise'}
				<p class="small"><span class="pill pill-gold">Your teacher left {assignment.feedback.length} comments</span></p>
			{/if}
		</div>
		<a class="btn btn-primary btn-block" href={next.href}>{next.cta}</a>
	{:else}
		<div class="next">
			<p class="action">All 5 steps done.</p>
			<p class="small muted">Your goal for next time: “{demo.goal}”</p>
		</div>
		<a class="btn btn-ghost btn-block" href="/student/mirror">See how you did</a>
	{/if}
</section>

<section class="stack">
	<h2 class="section-title">Other work</h2>
	<ul class="list">
		{#each otherWork as w (w.title)}
			<li class="card row">
				<div>
					<p class="title">{w.title}</p>
					<p class="small muted">{w.status}</p>
				</div>
				<button class="btn btn-ghost btn-small" disabled title="Not part of the demo">{w.cta}</button>
			</li>
		{/each}
	</ul>
</section>

<p class="small muted reset">
	Demo: <button class="linkish" onclick={resetDemo}>start the walkthrough over</button>
</p>

<style>
	.hello {
		gap: 0.75rem;
	}
	.kicker {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-3);
	}
	.up-next {
		border-color: var(--brand-2);
		gap: 0.85rem;
	}
	.track {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.3rem;
		font-size: 0.72rem;
		color: var(--ink-3);
	}
	.track li {
		border-top: 6px solid var(--line);
		border-radius: 3px;
		padding-top: 0.3rem;
	}
	.track li.done {
		border-color: var(--brand-2);
	}
	.track li.current {
		border-color: var(--gold);
		color: var(--ink);
		font-weight: 700;
	}
	.next {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.action {
		font-size: 1.25rem;
		font-weight: 700;
	}
	.section-title {
		font-size: 1rem;
		color: var(--ink-2);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1rem;
		box-shadow: none;
	}
	.title {
		font-weight: 700;
	}
	.reset {
		text-align: center;
	}
	.linkish {
		background: none;
		border: 0;
		padding: 0;
		font: inherit;
		color: var(--brand-2);
		text-decoration: underline;
		cursor: pointer;
	}
</style>
