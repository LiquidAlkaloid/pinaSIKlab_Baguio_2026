<script lang="ts">
	// Process Mirror (#7): the student sees the same process report their teacher saw.
	// Only their own work. No class averages, no rankings, no other students.
	import DraftChanges from '#lib/components/DraftChanges.svelte';
	import Locked from '#lib/components/Locked.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import { AI_USES, assignment, criterionScores, draftLabel, feedbackRound, grade, rubricCriteria } from '#lib/data.ts';
	import {
		course,
		courseSteps,
		declarationFor,
		demo,
		draftChanges,
		itemsFor,
		roundOf,
		formatDate,
		onTime,
		snapshotFor,
		summaryFor,
		type AiUseDeclaration
	} from '#lib/state.svelte.ts';

	const steps = $derived(courseSteps());
	const stageSteps = $derived(steps.filter((s) => s.stage));
	const final = $derived(snapshotFor(demo, course.stages[course.stages.length - 1]));
	const reflectStep = $derived(steps[steps.length - 1]);

	const timeline = $derived([
		{ step: steps[0], at: demo.reading.saved_at },
		...stageSteps.map((step) => ({ step, at: snapshotFor(demo, step.stage)?.submitted_at ?? null }))
	]);

	const counts = $derived({
		addressed: demo.feedback_resolutions.filter((r) => r.action === 'addressed').length,
		partly: demo.feedback_resolutions.filter((r) => r.action === 'partly_addressed').length,
		declined: demo.feedback_resolutions.filter((r) => r.action === 'declined').length
	});
	const total = $derived(demo.feedback_resolutions.length);

	// For each draft after the first: what changed since the one before, and what was kept on purpose.
	const revisions = $derived(
		course.stages.slice(1).map((stage, i) => {
			const k = i + 1;
			const items = itemsFor(demo, k);
			return {
				stage,
				changes: draftChanges(demo, course.stages, k),
				kept: roundOf(demo, k)
					.filter((r) => r.action === 'declined')
					.map((r) => ({ n: items.find((it) => it.id === r.feedback_item_id)?.number, reason: r.decline_reason }))
			};
		})
	);

	const drafts = $derived(
		stageSteps.map((step) => {
			const ss = snapshotFor(demo, step.stage);
			return { step, summary: summaryFor(demo, ss)?.body, ai: declarationFor(demo, ss) };
		})
	);

	const aiLabel = (level: number) => AI_USES.find((u) => u.level === level)?.label ?? 'Not answered';
	function aiText(ai: AiUseDeclaration | undefined) {
		if (!ai) return 'Not answered';
		const tools = ai.tools_used.length ? ` (${ai.tools_used.join(', ')})` : '';
		return aiLabel(ai.level_used) + tools + (ai.description ? `: “${ai.description}”` : '');
	}

	const processCriteria = rubricCriteria
		.filter((c) => c.kind === 'process')
		.map((c) => ({ ...c, scored: criterionScores.find((s) => s.criterion_id === c.id) }));

	let saved = $state(!!demo.reflection.created_at);
	const canSave = $derived(demo.next_goal.trim().length > 5 && demo.reflection.responses.changed_most.trim().length > 5);

	function save() {
		demo.reflection.created_at = new Date().toISOString();
		saved = true;
	}
</script>

<svelte:head><title>How you did · MYRACLE</title></svelte:head>

<StepHeader n={reflectStep.n} title="How your process went" />

{#if !final}
	<Locked what="Hand in your final essay first." href="/student/revise/{course.stages.length - 1}" />
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
			<p class="big">{grade.final_score}</p>
		</div>
		<p class="small muted">
			Essay {grade.output_score} ({100 - course.process_weight_pct}%) · How you worked on it {grade.process_score} ({course.process_weight_pct}%)
		</p>
	</section>

	<section class="card stack">
		<h2><span class="sec">1</span> Steps and when you handed them in</h2>
		<ol class="timeline">
			{#each timeline as t (t.step.key)}
				{@const ok = onTime(t.at, t.step.due_at)}
				<li>
					<span class="tdot" class:late={ok === false}></span>
					<span class="tname">{t.step.name}</span>
					<span class="small muted">
						{t.at ? formatDate(t.at) : '—'}{ok === null ? '' : ok ? ' · on time' : ' · late'}
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="card stack">
		<h2><span class="sec">2</span> How you answered {total} comments</h2>
		<div class="bar" role="img" aria-label="{counts.addressed} fixed, {counts.partly} partly fixed, {counts.declined} kept with a reason">
			<span class="seg fixed" style="flex: {counts.addressed}"></span>
			<span class="seg partly" style="flex: {counts.partly}"></span>
			<span class="seg kept" style="flex: {counts.declined}"></span>
		</div>
		<p class="small legend">
			<span><i class="key fixed"></i>Fixed {counts.addressed}</span>
			<span><i class="key partly"></i>Partly {counts.partly}</span>
			<span><i class="key kept"></i>Kept with a reason {counts.declined}</span>
		</p>
	</section>

	<section class="card stack">
		<h2><span class="sec">3</span> What changed between your drafts</h2>
		{#if drafts[0]?.summary}
			<p class="muted">Your first draft, summed up by AI: “{drafts[0].summary}”</p>
		{/if}
		{#each revisions as rev, i (rev.stage.id)}
			<div class="rev stack">
				<h3>
					{draftLabel(rev.stage, course.stages)}, compared with {i === 0 ? 'your first draft' : draftLabel(course.stages[i], course.stages)}
				</h3>
				<DraftChanges changes={rev.changes} />
				{#each rev.kept as kept (kept.n)}
					<p class="kept small">Comment {kept.n}, kept the same: “{kept.reason}”</p>
				{/each}
			</div>
		{/each}
	</section>

	<section class="card stack">
		<h2><span class="sec">4</span> What you said about AI</h2>
		<dl class="ai">
			<dt>Read</dt>
			<dd>Summary written in MYRACLE, no AI</dd>
			{#each drafts as d (d.step.key)}
				<dt>{d.step.stage ? draftLabel(d.step.stage, course.stages) : ''}</dt>
				<dd>
					{aiText(d.ai)}
				</dd>
			{/each}
		</dl>
	</section>

	<section class="card stack">
		<h2><span class="sec">5</span> Your teacher’s rubric for how you worked</h2>
		{#each processCriteria as c (c.id)}
			{@const score = c.scored?.score ?? 0}
			<div class="crit">
				<div class="crit-row">
					<span class="crit-name">{c.name}</span>
					<span class="boxes" aria-label="{score} of {c.max_points}">
						{#each Array(c.max_points) as _, i (i)}<i class:on={i < score}></i>{/each}
					</span>
					<span class="small muted">{score} of {c.max_points}</span>
				</div>
				{#if c.scored?.comment}<p class="pen note">{c.scored.comment}</p>{/if}
			</div>
		{/each}
	</section>

	<section class="card stack reflect">
		<h2>Your turn: look back</h2>
		<label class="field">
			What changed most between your drafts, and why?
			<textarea rows="3" bind:value={demo.reflection.responses.changed_most}></textarea>
		</label>
		<label class="field">
			Which comment was hardest to act on?
			<textarea rows="2" bind:value={demo.reflection.responses.hardest_item}></textarea>
		</label>
		<label class="field">
			Where did your score surprise you?
			<textarea rows="2" bind:value={demo.reflection.responses.score_surprise}></textarea>
		</label>
		<div class="goal stack goal-box">
			<label class="field" for="goal">
				<span class="goal-label">One goal for next time</span>
			</label>
			<input id="goal" type="text" bind:value={demo.next_goal} placeholder="Example: Use two paragraphs from the article as evidence." />
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
		grid-template-columns: repeat(auto-fit, minmax(4.25rem, 1fr));
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
	.rev {
		gap: 0.6rem;
	}
	.rev + .rev {
		padding-top: 0.85rem;
		border-top: 1px solid var(--line);
	}
	.rev h3 {
		font-size: 0.95rem;
	}
	.kept {
		padding-left: 0.75rem;
		border-left: 3px solid var(--kept);
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
		width: 14px;
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
