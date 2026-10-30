<script lang="ts">
	// Process Mirror (#10): the student sees the same process report their teacher saw.
	// Only their own work. No class averages, no rankings, no other students.
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { AI_USES, assignment, type AiUse } from '#lib/data.ts';
	import { demo, formatDate, onTime } from '#lib/state.svelte.ts';

	const steps = assignment.steps;

	const timeline = $derived([
		{ step: steps[0], at: demo.readAt },
		{ step: steps[1], at: demo.draft.at },
		{ step: steps[2], at: demo.revisedAt },
		{ step: steps[3], at: demo.final.at }
	]);

	const counts = $derived({
		fixed: demo.answers.filter((a) => a.status === 'fixed').length,
		partly: demo.answers.filter((a) => a.status === 'partly').length,
		kept: demo.answers.filter((a) => a.status === 'kept').length
	});
	const total = assignment.feedback.length;

	const changes = $derived(
		assignment.feedback.map((item, i) => {
			const a = demo.answers[i];
			if (a.status === 'kept') {
				return { n: item.n, text: `Kept ¶${item.paragraph} the same: “${a.reason}”`, kind: 'kept' };
			}
			const what = a.note.trim() || `Changed in response to: ${item.comment}`;
			return {
				n: item.n,
				text: `¶${a.paragraph}: ${what}`,
				kind: a.status === 'partly' ? 'partly' : 'fixed'
			};
		})
	);

	const aiLabel = (v: AiUse | null) => AI_USES.find((u) => u.value === v)?.label ?? 'Not answered';

	let saved = $state(!!demo.reflectedAt);
	const canSave = $derived(demo.goal.trim().length > 5 && demo.reflection.changed.trim().length > 5);

	function save() {
		demo.reflectedAt = Date.now();
		saved = true;
	}
</script>

<svelte:head><title>Step 5: How you did · MYRACLE</title></svelte:head>

<StepHeader n={5} title="How your process went" />

{#if !demo.final.at}
	<Locked what="Hand in your final essay first." href="/student/final" />
{:else}
	<div class="card banner">
		<p>
			This is <strong>the same report your teacher saw</strong> for your essay. Use it to look back at
			how you worked.
		</p>
	</div>

	<section class="card stack grade">
		<div>
			<p class="small muted">{assignment.title}</p>
			<p class="big">{assignment.finalGrade}</p>
		</div>
		<p class="small muted">
			Essay {100 - assignment.processWeight}% · How you worked on it {assignment.processWeight}%
		</p>
	</section>

	<section class="card stack">
		<h2><span class="sec">1</span> Your steps</h2>
		<ol class="timeline">
			{#each timeline as t (t.step.key)}
				{@const ok = onTime(t.at, t.step.due)}
				<li>
					<span class="tdot" class:late={ok === false}></span>
					<span class="tname">{t.step.name}</span>
					<span class="small muted">
						{t.at ? formatDate(t.at) : '—'}{#if ok !== null} · {ok ? 'on time' : 'late'}{/if}
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="card stack">
		<h2><span class="sec">2</span> How you answered {total} comments</h2>
		<div class="bar" role="img" aria-label="{counts.fixed} fixed, {counts.partly} partly fixed, {counts.kept} kept with a reason">
			<span class="seg fixed" style="flex: {counts.fixed}"></span>
			<span class="seg partly" style="flex: {counts.partly}"></span>
			<span class="seg kept" style="flex: {counts.kept}"></span>
		</div>
		<p class="small legend">
			<span><i class="key fixed"></i>Fixed {counts.fixed}</span>
			<span><i class="key partly"></i>Partly {counts.partly}</span>
			<span><i class="key kept"></i>Kept with a reason {counts.kept}</span>
		</p>
	</section>

	<section class="card stack">
		<h2><span class="sec">3</span> What changed between your drafts</h2>
		<ul class="changes">
			{#each changes as c (c.n)}
				<li class={c.kind}>
					<span>{c.text}</span>
					<span class="small muted">comment {c.n}{c.kind === 'partly' ? ', partly' : ''}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="card stack">
		<h2><span class="sec">4</span> What you said about AI</h2>
		<dl class="ai">
			<dt>Read</dt>
			<dd>Summary written in MYRACLE, no AI</dd>
			<dt>Draft</dt>
			<dd>{aiLabel(demo.draft.ai)}{#if demo.draft.aiNote}: “{demo.draft.aiNote}”{/if}</dd>
			<dt>Final</dt>
			<dd>{aiLabel(demo.final.ai)}{#if demo.final.aiNote}: “{demo.final.aiNote}”{/if}</dd>
		</dl>
	</section>

	<section class="card stack">
		<h2><span class="sec">5</span> Your teacher’s rubric for how you worked</h2>
		{#each assignment.processScores as c (c.name)}
			<div class="crit">
				<div class="crit-row">
					<span class="crit-name">{c.name}</span>
					<span class="boxes" aria-label="{c.score} of {c.max}">
						{#each Array(c.max) as _, i (i)}<i class:on={i < c.score}></i>{/each}
					</span>
					<span class="small muted">{c.score} of {c.max}</span>
				</div>
				<p class="pen note">{c.note}</p>
			</div>
		{/each}
	</section>

	<section class="card stack reflect">
		<h2>Your turn: look back</h2>
		<label class="field">
			What changed most between your drafts, and why?
			<textarea rows="3" bind:value={demo.reflection.changed}></textarea>
		</label>
		<label class="field">
			Which comment was hardest to act on?
			<textarea rows="2" bind:value={demo.reflection.hardest}></textarea>
		</label>
		<label class="field">
			Where did your score surprise you?
			<textarea rows="2" bind:value={demo.reflection.surprise}></textarea>
		</label>
		<div class="goal stack goal-box">
			<label class="field" for="goal">
				<span class="goal-label">One goal for next time</span>
			</label>
			<input id="goal" type="text" bind:value={demo.goal} placeholder="Example: Use two paragraphs from the article as evidence." />
			<p class="small muted">You will see this at the top of your next assignment. Your teacher sees it too.</p>
		</div>
		{#if saved}
			<p class="pill pill-ok saved">Saved. See you on the next assignment.</p>
			<a class="btn btn-ghost btn-block" href="/student">Back to home</a>
		{:else}
			<button class="btn btn-primary btn-block" disabled={!canSave} onclick={save}>Save my reflection</button>
		{/if}
	</section>

	<p class="small muted center">Only your own work is shown here: no class averages, no rankings, no other students’ papers.</p>
{/if}

<style>
	.banner {
		background: var(--brand-soft);
		border-color: #c9d5ea;
		box-shadow: none;
	}
	.grade {
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
	}
	.big {
		font-size: 2.6rem;
		font-weight: 700;
		line-height: 1;
		color: var(--brand);
	}
	.grade .small:last-child {
		text-align: right;
		max-width: 12rem;
	}
	.sec {
		display: inline-grid;
		place-items: center;
		width: 24px;
		height: 24px;
		margin-right: 0.35rem;
		border-radius: 50%;
		background: var(--brand-soft);
		color: var(--brand);
		font-size: 0.8rem;
		vertical-align: 2px;
	}
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.4rem;
	}
	.timeline li {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.tdot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--brand-2);
	}
	.tdot.late {
		background: var(--gold);
	}
	.tname {
		font-weight: 700;
	}
	.bar {
		display: flex;
		height: 16px;
		border-radius: 999px;
		overflow: hidden;
		background: var(--sunken);
		gap: 2px;
	}
	.seg.fixed,
	.key.fixed {
		background: var(--ok);
	}
	.seg.partly,
	.key.partly {
		background: var(--partly);
	}
	.seg.kept,
	.key.kept {
		background: var(--kept);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
	}
	.key {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 3px;
		margin-right: 0.35rem;
	}
	.changes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.changes li {
		display: flex;
		flex-direction: column;
		padding-left: 0.75rem;
		border-left: 3px solid var(--ok);
	}
	.changes li.partly {
		border-color: var(--partly);
	}
	.changes li.kept {
		border-color: var(--kept);
	}
	.ai {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.4rem 1rem;
		margin: 0;
	}
	.ai dt {
		font-weight: 700;
	}
	.ai dd {
		margin: 0;
	}
	.crit {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.crit-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.crit-name {
		font-weight: 700;
		flex: 1 1 9rem;
	}
	.boxes {
		display: inline-flex;
		gap: 3px;
	}
	.boxes i {
		width: 18px;
		height: 12px;
		border-radius: 3px;
		background: var(--line);
	}
	.boxes i.on {
		background: var(--brand-2);
	}
	.note {
		font-size: 1.3rem;
	}
	.reflect {
		border-color: var(--gold);
	}
	.goal-box {
		gap: 0.5rem;
	}
	.saved {
		align-self: flex-start;
		white-space: normal;
	}
	.center {
		text-align: center;
	}
</style>
